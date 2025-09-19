#!/usr/bin/env pwsh
# start-dev.ps1 - Start both backend and frontend servers

Write-Host "🚀 Starting RateMyProf Development Servers..." -ForegroundColor Green
Write-Host ""

# Function to start backend
function Start-Backend {
    Write-Host "📡 Starting Backend Server (FastAPI)..." -ForegroundColor Cyan
    Set-Location "D:\spec-driven-projects\ratemyprof\backend"
    python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
}

# Function to start frontend  
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Server (Next.js)..." -ForegroundColor Magenta
    Set-Location "D:\spec-driven-projects\ratemyprof\frontend"
    npm run dev
}

Write-Host "Backend will run on: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend will run on: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Red
Write-Host ""

# Start both servers in parallel using PowerShell jobs
$BackendJob = Start-Job -ScriptBlock { Set-Location "D:\spec-driven-projects\ratemyprof\backend"; python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 }
$FrontendJob = Start-Job -ScriptBlock { Set-Location "D:\spec-driven-projects\ratemyprof\frontend"; npm run dev }

Write-Host "✅ Both servers started!" -ForegroundColor Green
Write-Host "📡 Backend Job ID: $($BackendJob.Id)" -ForegroundColor Cyan  
Write-Host "🎨 Frontend Job ID: $($FrontendJob.Id)" -ForegroundColor Magenta
Write-Host ""
Write-Host "To view logs: Get-Job | Receive-Job" -ForegroundColor Yellow
Write-Host "To stop: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Red

# Keep script running and show job status
try {
    while ($true) {
        Start-Sleep -Seconds 5
        $BackendState = (Get-Job -Id $BackendJob.Id).State
        $FrontendState = (Get-Job -Id $FrontendJob.Id).State
        
        Write-Host "Status - Backend: $BackendState | Frontend: $FrontendState" -ForegroundColor Gray
        
        if ($BackendState -eq "Failed" -or $FrontendState -eq "Failed") {
            Write-Host "❌ One or both servers failed!" -ForegroundColor Red
            break
        }
    }
}
finally {
    Write-Host "🛑 Stopping servers..." -ForegroundColor Red
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    Write-Host "✅ Servers stopped." -ForegroundColor Green
}