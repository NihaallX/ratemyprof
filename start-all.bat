@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 🚀 RateMyProf - Full Stack Launch
echo ========================================
echo.
echo 📍 Server URLs:
echo    Landing Page: http://localhost:3001
echo    Main App:     http://localhost:3000
echo    Backend API:  http://localhost:8000
echo    API Docs:     http://localhost:8000/docs
echo.
echo Press Ctrl+C in any window to stop that server
echo.

REM Get current directory
set "PROJECT_ROOT=%~dp0"

REM Check if all directories exist
if not exist "%PROJECT_ROOT%backend" (
    echo ❌ Error: Backend directory not found
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%frontend" (
    echo ❌ Error: Frontend directory not found
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%landing-site" (
    echo ❌ Error: Landing site directory not found
    pause
    exit /b 1
)

REM Start backend in new window
echo 🔷 Starting Backend Server (Port 8000)...
start "🔷 Backend - FastAPI (Port 8000)" cmd /k "cd /d "%PROJECT_ROOT%backend" && set PYTHONPATH=%CD% && python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start main frontend in new window
echo 🔶 Starting Main Frontend (Port 3000)...
start "🔶 Frontend - Next.js (Port 3000)" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm run dev"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start landing page in new window
echo 🟢 Starting Landing Page (Port 3001)...
start "🟢 Landing - Vite (Port 3001)" cmd /k "cd /d "%PROJECT_ROOT%landing-site" && npm run dev -- --port 3001"

echo.
echo ========================================
echo ✅ All servers launched in separate windows!
echo ========================================
echo.
echo 🌐 Quick Access:
echo    Landing Page: http://localhost:3001
echo    Main App:     http://localhost:3000
echo    API Docs:     http://localhost:8000/docs
echo.
echo 💡 Tip: Check each terminal window for server logs
echo.
echo Press any key to close this launcher...
pause >nul
