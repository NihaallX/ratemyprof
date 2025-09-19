@echo off
echo 🚀 Starting RateMyProf Development Servers...
echo.
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:3000  
echo Press Ctrl+C to stop both servers
echo.

REM Start backend in new window
start "🔷 Backend (FastAPI)" cmd /k "cd /d D:\spec-driven-projects\ratemyprof\backend && python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "🔶 Frontend (Next.js)" cmd /k "cd /d D:\spec-driven-projects\ratemyprof\frontend && npm run dev"

echo ✅ Both servers started in separate windows!
echo 🌐 Visit: http://localhost:3000
pause