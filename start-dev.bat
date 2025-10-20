@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting RateMyProf Development Servers...
echo.
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:3000  
echo Press Ctrl+C to stop both servers
echo.

REM Get current directory
set "PROJECT_ROOT=%~dp0"

REM Check if backend directory exists
if not exist "%PROJECT_ROOT%backend" (
    echo ❌ Error: Backend directory not found at %PROJECT_ROOT%backend
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "%PROJECT_ROOT%frontend" (
    echo ❌ Error: Frontend directory not found at %PROJECT_ROOT%frontend
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Start backend in new window
echo 📡 Starting Backend Server...
start "🔷 Backend (FastAPI)" cmd /k "cd /d "%PROJECT_ROOT%backend" && set PYTHONPATH=%CD% && python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo 🎨 Starting Frontend Server...
start "🔶 Frontend (Next.js)" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm run dev"

echo ✅ Both servers started in separate windows!
echo 🌐 Frontend: http://localhost:3000
echo 📡 Backend API: http://localhost:8000/docs
echo.
echo Press any key to exit this launcher...
pause