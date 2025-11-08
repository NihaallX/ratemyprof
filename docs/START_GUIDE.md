# 🚀 Quick Start Scripts

Launch all parts of the RateMyProf application with a single command!

## 📦 What Gets Started

1. **Landing Page** (Port 3001) - `landing-site/` - Vite + React
2. **Main App** (Port 3000) - `frontend/` - Next.js
3. **Backend API** (Port 8000) - `backend/` - FastAPI + Python

## 🎯 Quick Start

### Option 1: PowerShell (Recommended)
```powershell
.\start-all.ps1
```
**Features:**
- ✅ Single integrated terminal
- ✅ Color-coded logs
- ✅ Automatic cleanup on Ctrl+C
- ✅ Real-time server status

### Option 2: Batch File (Simple)
```cmd
.\start-all.bat
```
**Features:**
- ✅ Opens 3 separate terminal windows
- ✅ Easy to monitor each server individually
- ✅ Simple and straightforward

## 🌐 URLs After Launch

| Service | URL | Description |
|---------|-----|-------------|
| 🟢 Landing Page | http://localhost:3001 | Marketing/Landing page |
| 🔶 Main App | http://localhost:3000 | Main application |
| 🔷 Backend API | http://localhost:8000 | REST API |
| 📚 API Docs | http://localhost:8000/docs | Interactive API documentation |

## 🛠️ Individual Server Scripts

If you want to run servers separately:

### Backend Only
```powershell
cd backend
python -m uvicorn src.main:app --reload --port 8000
```

### Frontend Only
```powershell
cd frontend
npm run dev
```

### Landing Page Only
```powershell
cd landing-site
npm run dev -- --port 3001
```

## 📋 Prerequisites

Make sure you have these installed:
- ✅ **Node.js** (v18+) - For frontend and landing page
- ✅ **Python** (3.11+) - For backend
- ✅ **npm** - For package management

## 🔧 First Time Setup

Before running the scripts for the first time:

```powershell
# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install landing page dependencies
cd landing-site
npm install
cd ..
```

## 🐛 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

**Windows:**
```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Python Module Not Found
```powershell
cd backend
pip install -r requirements.txt
```

### npm Dependencies Missing
```powershell
cd frontend
npm install

cd ../landing-site
npm install
```

## 🎨 Development Workflow

1. **Start all servers**: `.\start-all.ps1` or `.\start-all.bat`
2. **Visit landing page**: http://localhost:3001
3. **Click sign-in/sign-up**: Gets redirected to http://localhost:3000/auth/...
4. **Use the app**: Navigate around at http://localhost:3000
5. **API calls**: Automatically go to http://localhost:8000

## 🔄 Hot Reload

All servers support hot reload:
- ✅ **Landing Page**: Vite HMR (instant updates)
- ✅ **Frontend**: Next.js Fast Refresh
- ✅ **Backend**: Uvicorn auto-reload

Just save your files and see changes instantly!

## 🛑 Stopping Servers

### PowerShell Script
Press `Ctrl+C` in the terminal - all servers stop automatically

### Batch Script
Close each terminal window individually or press `Ctrl+C` in each

## 💡 Tips

- **Check logs**: Each server shows detailed logs in its terminal
- **API testing**: Visit http://localhost:8000/docs for interactive API testing
- **Dark mode**: Toggle in the main app header (persists across sessions)
- **Auth flow**: Landing page → Auth iframe preloads → Smooth transition

## 📝 Scripts Summary

| Script | Type | Best For |
|--------|------|----------|
| `start-all.ps1` | PowerShell | Development (single terminal) |
| `start-all.bat` | Batch | Quick start (multiple windows) |
| `start-dev.ps1` | PowerShell | Frontend + Backend only |
| `start-dev.bat` | Batch | Frontend + Backend only |

## 🎉 That's It!

You're ready to develop! Happy coding! 🚀
