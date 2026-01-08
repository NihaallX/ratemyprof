# 🚀 Render Deployment Guide

## Quick Setup

### 1. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)

### 2. Deploy Backend

#### Option A: Using render.yaml (Recommended)
1. Push code to GitHub
2. In Render Dashboard → New → Blueprint
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Add environment variables (see below)
6. Click "Apply"

#### Option B: Manual Setup
1. In Render Dashboard → New → Web Service
2. Connect GitHub repo
3. Configure:
   - **Name**: `ratemyprof-backend`
   - **Region**: Singapore (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### 3. Environment Variables

Add these in Render Dashboard → Environment:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# CORS (add your frontend domains)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Security
DOCS_ENABLED=true
AUTO_BAN_ENABLED=true
ENVIRONMENT=production
```

### 4. Deploy Frontend to Vercel

```bash
# In your local machine
cd frontend
vercel
```

Follow prompts and add environment variables:
```bash
NEXT_PUBLIC_API_URL=https://your-app.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🤖 Keep-Alive Bot Setup

### Option 1: UptimeRobot (Easiest - No Coding)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up for free account
3. Add New Monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: RateMyProf Backend
   - **URL**: `https://your-app.onrender.com/health`
   - **Monitoring Interval**: 5 minutes
4. Done! Your backend stays warm 24/7

### Option 2: GitHub Actions (Free, Built-in)

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Backend Alive

on:
  schedule:
    # Runs every 14 minutes
    - cron: '*/14 * * * *'
  workflow_dispatch:  # Manual trigger

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: |
          curl -f https://your-app.onrender.com/health || exit 1
      
      - name: Check Status
        run: echo "Backend is alive!"
```

Push to GitHub and it runs automatically!

### Option 3: Python Keep-Alive Script

Create `keep-alive-bot.py`:

```python
import requests
import time
from datetime import datetime

BACKEND_URL = "https://your-app.onrender.com/health"
INTERVAL = 840  # 14 minutes in seconds

print("🤖 Keep-Alive Bot Started")
print(f"Pinging {BACKEND_URL} every 14 minutes...")

while True:
    try:
        response = requests.get(BACKEND_URL, timeout=30)
        status = "✅" if response.status_code == 200 else "⚠️"
        print(f"{status} [{datetime.now()}] Status: {response.status_code}")
    except Exception as e:
        print(f"❌ [{datetime.now()}] Error: {e}")
    
    time.sleep(INTERVAL)
```

Run on any server:
```bash
pip install requests
python keep-alive-bot.py
```

---

## 📋 Post-Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Environment variables configured
- [ ] Health endpoint responding: `/health`
- [ ] API docs accessible: `/docs`
- [ ] Keep-alive bot configured
- [ ] Frontend deployed to Vercel
- [ ] Frontend connected to Render backend
- [ ] Test authentication flow
- [ ] Test database operations
- [ ] Monitor logs in Render dashboard

---

## 🔍 Troubleshooting

### Backend Not Starting
1. Check Render logs: Dashboard → Service → Logs
2. Verify all environment variables are set
3. Check `requirements.txt` has all dependencies

### Cold Starts Taking Too Long
- Upgrade to paid plan ($7/month) for persistent instances
- Or use keep-alive bot (free)

### CORS Errors
Update `ALLOWED_ORIGINS` in Render to include your Vercel domain:
```
https://yourdomain.vercel.app,https://yourdomain.com
```

### Database Connection Issues
Verify `DATABASE_URL` format:
```
postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

---

## 🎯 Your Backend URLs

After deployment:
- **Backend API**: `https://your-app.onrender.com`
- **API Docs**: `https://your-app.onrender.com/docs`
- **Health Check**: `https://your-app.onrender.com/health`

Update frontend's `NEXT_PUBLIC_API_URL` with your Render URL!

---

## 💡 Tips

1. **Free Tier Limits**: 750 hours/month (enough for 24/7)
2. **Cold Start**: ~30-50 seconds after 15 min inactivity
3. **Keep-Alive**: Prevents cold starts completely
4. **Logs**: Check Render dashboard for real-time logs
5. **Custom Domain**: Add in Render settings (free)

---

## 🆘 Need Help?

Check logs:
```bash
# Render Dashboard → Your Service → Logs
```

Common fixes:
- Environment variables missing → Add in dashboard
- Port binding issue → Start command uses `$PORT`
- Import errors → Check `requirements.txt`
