# 🎯 RateMyProf - Development Scripts Quick Reference

## 🚀 Main Launch Scripts

### **Recommended: PowerShell (Integrated)**
```powershell
.\start-all.ps1
```
✨ **Features:** Single terminal, color-coded logs, auto-cleanup

### **Alternative: Batch (Separate Windows)**
```cmd
.\start-all.bat
```
✨ **Features:** 3 terminal windows, easy to monitor individually

### **Super Quick: One-Click Launch**
```powershell
.\run.ps1    # PowerShell
.\run.bat    # Batch
```
✨ Just double-click these files!

---

## 📊 What Gets Started

```
┌─────────────────────────────────────────────────────────┐
│  🟢 Landing Page        → http://localhost:3001         │
│     (landing-site/)       Vite + React                  │
├─────────────────────────────────────────────────────────┤
│  🔶 Main Application    → http://localhost:3000         │
│     (frontend/)           Next.js                       │
├─────────────────────────────────────────────────────────┤
│  🔷 Backend API         → http://localhost:8000         │
│     (backend/)            FastAPI + Python              │
│                           Docs: /docs                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Setup & Health Check

### **Check if everything is ready:**
```powershell
.\check-setup.ps1
```
Verifies:
- ✅ Node.js, npm, Python installed
- ✅ All directories exist
- ✅ Dependencies installed
- ✅ Ports available

### **First-time setup:**
```powershell
# Install all dependencies
cd backend
pip install -r requirements.txt
cd ..

cd frontend
npm install
cd ..

cd landing-site
npm install
cd ..
```

---

## 🎮 Individual Server Commands

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

---

## 🛑 Stopping Servers

| Method | How to Stop |
|--------|-------------|
| PowerShell (`start-all.ps1`) | Press `Ctrl+C` → all stop automatically |
| Batch (`start-all.bat`) | Close each window or `Ctrl+C` in each |

---

## 🐛 Common Issues & Fixes

### **Port Already in Use**
```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process (replace 1234 with actual PID)
taskkill /PID 1234 /F
```

### **Module Not Found**
```powershell
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install

# Landing
cd landing-site
npm install
```

### **Python Path Issues**
```powershell
cd backend
$env:PYTHONPATH = $pwd
python -m uvicorn src.main:app --reload
```

---

## 📝 All Available Scripts

| File | Purpose | Usage |
|------|---------|-------|
| `start-all.ps1` | Launch all 3 servers (PowerShell) | `.\start-all.ps1` |
| `start-all.bat` | Launch all 3 servers (Batch) | `.\start-all.bat` |
| `run.ps1` | Quick launcher (PowerShell) | `.\run.ps1` or double-click |
| `run.bat` | Quick launcher (Batch) | `.\run.bat` or double-click |
| `check-setup.ps1` | Health check & dependency verification | `.\check-setup.ps1` |
| `start-dev.ps1` | Launch Frontend + Backend only | `.\start-dev.ps1` |
| `start-dev.bat` | Launch Frontend + Backend only | `.\start-dev.bat` |

---

## 🌊 Development Flow

```
1. Run: .\start-all.ps1
   ↓
2. Visit: http://localhost:3001 (Landing Page)
   ↓
3. Click "Sign In" or "Sign Up"
   ↓
4. Auth iframe preloads → Smooth transition
   ↓
5. Main app: http://localhost:3000
   ↓
6. Use the app → API calls to http://localhost:8000
   ↓
7. Make changes → Hot reload updates instantly! 🔥
```

---

## 💡 Pro Tips

✅ **Use PowerShell script** - Better logging and error handling  
✅ **Check setup first** - Run `check-setup.ps1` before starting  
✅ **Keep terminals open** - See real-time logs  
✅ **Use API docs** - http://localhost:8000/docs for testing  
✅ **Dark mode works** - Toggle in header, persists across sessions  

---

## 🎨 Hot Reload is Enabled

All servers support live updates:
- **Landing Page**: Vite HMR (instant!)
- **Frontend**: Next.js Fast Refresh
- **Backend**: Uvicorn auto-reload

Just save and see changes! No manual refresh needed! ⚡

---

## 📚 Documentation

- `START_GUIDE.md` - Detailed guide with troubleshooting
- `LANDING_PAGE_FLOW.md` - Auth iframe implementation details
- `COMPLETION_REPORT.md` - Dark mode implementation status

---

## ✨ Quick Start TL;DR

```powershell
# 1. Check everything is ready
.\check-setup.ps1

# 2. Start all servers
.\start-all.ps1

# 3. Open browser
# Landing: http://localhost:3001
# Main App: http://localhost:3000
# API Docs: http://localhost:8000/docs

# 4. Develop! 🚀
```

---

Made with ❤️ for easy development  
**Happy Coding!** 🎉
