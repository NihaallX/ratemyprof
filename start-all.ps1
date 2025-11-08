#!/usr/bin/env pwsh
# start-all.ps1 - Start Landing Page, Frontend, and Backend servers

Write-Host "🚀 Starting RateMyProf - Full Stack Development Servers..." -ForegroundColor Green
Write-Host ""

# Get script directory (project root)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"
$LandingPath = Join-Path $ProjectRoot "landing-site"

# Check if directories exist
if (-not (Test-Path $BackendPath)) {
    Write-Host "❌ Error: Backend directory not found at $BackendPath" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $FrontendPath)) {
    Write-Host "❌ Error: Frontend directory not found at $FrontendPath" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $LandingPath)) {
    Write-Host "❌ Error: Landing site directory not found at $LandingPath" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Server URLs:" -ForegroundColor Cyan
Write-Host "   Landing Page: http://localhost:3001" -ForegroundColor Yellow
Write-Host "   Main App:     http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend API:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "   API Docs:     http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Red
Write-Host ""

# Start all servers in parallel using PowerShell jobs
Write-Host "🔷 Starting Backend Server (Port 8000)..." -ForegroundColor Cyan
$BackendJob = Start-Job -ScriptBlock { 
    param($BackendPath)
    Set-Location $BackendPath
    $env:PYTHONPATH = $BackendPath
    python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
} -ArgumentList $BackendPath

Start-Sleep -Seconds 1

Write-Host "🔶 Starting Main Frontend (Port 3000)..." -ForegroundColor Magenta  
$FrontendJob = Start-Job -ScriptBlock { 
    param($FrontendPath)
    Set-Location $FrontendPath
    npm run dev
} -ArgumentList $FrontendPath

Start-Sleep -Seconds 1

Write-Host "🟢 Starting Landing Page (Port 3001)..." -ForegroundColor Green
$LandingJob = Start-Job -ScriptBlock { 
    param($LandingPath)
    Set-Location $LandingPath
    npm run dev -- --port 3001
} -ArgumentList $LandingPath

# Wait for jobs to initialize
Start-Sleep -Seconds 3

# Check if jobs started successfully
$BackendState = (Get-Job -Id $BackendJob.Id).State
$FrontendState = (Get-Job -Id $FrontendJob.Id).State
$LandingState = (Get-Job -Id $LandingJob.Id).State

Write-Host ""
Write-Host "📊 Server Status:" -ForegroundColor Cyan
Write-Host "   Backend:      $BackendState" -ForegroundColor $(if ($BackendState -eq "Running") { "Green" } else { "Red" })
Write-Host "   Frontend:     $FrontendState" -ForegroundColor $(if ($FrontendState -eq "Running") { "Green" } else { "Red" })
Write-Host "   Landing Page: $LandingState" -ForegroundColor $(if ($LandingState -eq "Running") { "Green" } else { "Red" })
Write-Host ""

if ($BackendState -eq "Running" -and $FrontendState -eq "Running" -and $LandingState -eq "Running") {
    Write-Host "✅ All servers started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Quick Access:" -ForegroundColor Cyan
    Write-Host "   Landing:  http://localhost:3001" -ForegroundColor White
    Write-Host "   Main App: http://localhost:3000" -ForegroundColor White
    Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some servers may have failed to start. Check the output above." -ForegroundColor Yellow
    Write-Host ""
}

# Stream output from all jobs
Write-Host "📝 Streaming server logs (press Ctrl+C to stop)..." -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""

try {
    # Keep script running and display output
    while ($true) {
        # Receive output from all jobs
        Receive-Job -Id $BackendJob.Id 2>&1 | ForEach-Object {
            Write-Host "[Backend] $_" -ForegroundColor Cyan
        }
        
        Receive-Job -Id $FrontendJob.Id 2>&1 | ForEach-Object {
            Write-Host "[Frontend] $_" -ForegroundColor Magenta
        }
        
        Receive-Job -Id $LandingJob.Id 2>&1 | ForEach-Object {
            Write-Host "[Landing] $_" -ForegroundColor Green
        }
        
        # Check if any job has failed
        if ((Get-Job -Id $BackendJob.Id).State -eq "Failed") {
            Write-Host "❌ Backend job failed!" -ForegroundColor Red
            break
        }
        if ((Get-Job -Id $FrontendJob.Id).State -eq "Failed") {
            Write-Host "❌ Frontend job failed!" -ForegroundColor Red
            break
        }
        if ((Get-Job -Id $LandingJob.Id).State -eq "Failed") {
            Write-Host "❌ Landing page job failed!" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Milliseconds 500
    }
}
finally {
    # Cleanup jobs on exit (Ctrl+C)
    Write-Host ""
    Write-Host "🛑 Stopping all servers..." -ForegroundColor Yellow
    
    Stop-Job -Id $BackendJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $FrontendJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $LandingJob.Id -ErrorAction SilentlyContinue
    
    Remove-Job -Id $BackendJob.Id -Force -ErrorAction SilentlyContinue
    Remove-Job -Id $FrontendJob.Id -Force -ErrorAction SilentlyContinue
    Remove-Job -Id $LandingJob.Id -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ All servers stopped." -ForegroundColor Green
}
