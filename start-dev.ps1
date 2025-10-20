#!/usr/bin/en    Write-Host "Error: Backend directory not found at $BWrite-Host "Both servers started successfully!" -ForegroundColor GreenckendPath" -ForegroundColor Red pwsh
# start-dev.ps1 - Start both backend and frontend servers

Write-Host "Starting RateMyProf Development Servers..." -ForegroundColor Green
Write-Host ""

# Get script directory (project root)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"

# Check if directories exist
if (-not (Test-Path $BackendPath)) {
    Write-Host "Error: Backend directory not found at $BackendPath" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $FrontendPath)) {
    Write-Host "Error: Frontend directory not found at $FrontendPath" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Backend will run on: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend will run on: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Red
Write-Host ""

# Start both servers in parallel using PowerShell jobs
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
$BackendJob = Start-Job -ScriptBlock { 
    param($BackendPath)
    Set-Location $BackendPath
    $env:PYTHONPATH = $BackendPath
    python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
} -ArgumentList $BackendPath

Write-Host "Starting Frontend Server..." -ForegroundColor Magenta  
$FrontendJob = Start-Job -ScriptBlock { 
    param($FrontendPath)
    Set-Location $FrontendPath
    npm run dev
} -ArgumentList $FrontendPath

# Wait a moment for jobs to initialize
Start-Sleep -Seconds 2

# Check if jobs started successfully
$BackendState = (Get-Job -Id $BackendJob.Id).State
$FrontendState = (Get-Job -Id $FrontendJob.Id).State

if ($BackendState -eq "Failed") {
    Write-Host "Backend failed to start!" -ForegroundColor Red
    Receive-Job -Id $BackendJob.Id
}

if ($FrontendState -eq "Failed") {
    Write-Host "Frontend failed to start!" -ForegroundColor Red
    Receive-Job -Id $FrontendJob.Id
}

if ($BackendState -eq "Failed" -or $FrontendState -eq "Failed") {
    Write-Host "Cleaning up failed jobs..." -ForegroundColor Yellow
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    exit 1
}

Write-Host " Both servers started successfully!" -ForegroundColor Green
Write-Host "Backend Job ID: $($BackendJob.Id)" -ForegroundColor Cyan  
Write-Host "Frontend Job ID: $($FrontendJob.Id)" -ForegroundColor Magenta
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Commands:" -ForegroundColor White
Write-Host "  View logs: Get-Job | Receive-Job" -ForegroundColor Gray
Write-Host "  Stop servers: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop all servers" -ForegroundColor Gray

# Keep script running and show job status
try {
    $StatusCheckInterval = 10
    $LastStatusTime = Get-Date
    
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Check job states
        $BackendState = (Get-Job -Id $BackendJob.Id -ErrorAction SilentlyContinue).State
        $FrontendState = (Get-Job -Id $FrontendJob.Id -ErrorAction SilentlyContinue).State
        
        # Show periodic status updates
        if ((Get-Date) - $LastStatusTime -gt [TimeSpan]::FromSeconds($StatusCheckInterval)) {
            Write-Host "Status - Backend: $BackendState | Frontend: $FrontendState" -ForegroundColor Gray
            $LastStatusTime = Get-Date
        }
        
        # Check for failures
        if ($BackendState -eq "Failed") {
            Write-Host "Backend server failed!" -ForegroundColor Red
            Write-Host "Backend error output:" -ForegroundColor Yellow
            Receive-Job -Id $BackendJob.Id -ErrorAction SilentlyContinue
            break
        }
        
        if ($FrontendState -eq "Failed") {
            Write-Host "Frontend server failed!" -ForegroundColor Red
            Write-Host "Frontend error output:" -ForegroundColor Yellow
            Receive-Job -Id $FrontendJob.Id -ErrorAction SilentlyContinue
            break
        }
        
        # Check if jobs completed unexpectedly
        if ($BackendState -eq "Completed" -or $FrontendState -eq "Completed") {
            Write-Host "One or both servers stopped unexpectedly." -ForegroundColor Yellow
            break
        }
    }
}
catch {
    Write-Host "Script interrupted: $($_.Exception.Message)" -ForegroundColor Yellow
}
finally {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Red
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Green
}