# 🚀 Environment Variables Setup Guide

## 📍 What You Need to Add WHERE

---

## 1️⃣ RAILWAY (Backend Deployment)

Go to Railway Dashboard → Your Project → Variables → **Raw Editor**

Copy and paste ALL of these:

```bash

ENVIRONMENT=production
PORT=8000
SUPABASE_URL=https://xgnewppqxqkyeabtmenf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDEyOTQsImV4cCI6MjA3MzUxNzI5NH0.bQE3Pc4pdaRfv1YWeK-6q_osSc8eLnJuQh5nJDarDCk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MTI5NCwiZXhwIjoyMDczNTE3Mjk0fQ.zXqhq-2wWioFz6jMGcL_hVmsuuqxbPQbxiImFjGvZzk
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$FZd1vfjg04VLqXMdQf.Noes21XD9UoeuyYYLm2o1uZRknrXDoEody
JWT_SECRET_KEY=jqVcjfb0k8_vVHVLrEEhB0OoMBGllh1rCyq6KlFt75p8kG9138ybecyK-uIe1Yml8pk_wkfp95h2w6Jb8d0apw
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=https://ratemyprof.me,https://app.ratemyprof.me,https://www.ratemyprof.me
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_WINDOW_MINUTES=15
AUTO_BAN_ENABLED=true
BAN_THRESHOLD_FAILED_LOGINS=10
BAN_THRESHOLD_RAPID_REQUESTS=100
BAN_DURATION_MINUTES=60
REQUESTS_WINDOW_SECONDS=60
WHITELIST_IPS=
DOCS_ENABLED=false
```
SUPABASE_URL="https://xgnewppqxqkyeabtmenf.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDEyOTQsImV4cCI6MjA3MzUxNzI5NH0.bQE3Pc4pdaRfv1YWeK-6q_osSc8eLnJuQh5nJDarDCk"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MTI5NCwiZXhwIjoyMDczNTE3Mjk0fQ.zXqhq-2wWioFz6jMGcL_hVmsuuqxbPQbxiImFjGvZzk"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$12$FZd1vfjg04VLqXMdQf.Noes21XD9UoeuyYYLm2o1uZRknrXDoEody"
JWT_SECRET_KEY="jqVcjfb0k8_vVHVLrEEhB0OoMBGllh1rCyq6KlFt75p8kG9138ybecyK-uIe1Yml8pk_wkfp95h2w6Jb8d0apw"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"
ALGORITHM="HS256"
ALLOWED_ORIGINS="https://ratemyprof.me,https://app.ratemyprof.me,https://www.ratemyprof.me"
RATE_LIMIT_ATTEMPTS="5"
RATE_LIMIT_WINDOW_MINUTES="15"
AUTO_BAN_ENABLED="true"
BAN_THRESHOLD_FAILED_LOGINS="10"
BAN_THRESHOLD_RAPID_REQUESTS="100"
BAN_DURATION_MINUTES="60"
REQUESTS_WINDOW_SECONDS="60"
WHITELIST_IPS=""
DOCS_ENABLED="false"

### ⚠️ IMPORTANT - DELETE THIS OLD VARIABLE:
In Railway, **delete** the variable named `RATE_LIMIT_ATTEMPTS` (it's a typo, should be `RATE_LIMIT_LOGIN_ATTEMPTS`)

---

## 2️⃣ SUPABASE (No Action Needed!)

✅ You already have everything from Supabase in Railway!

Your Supabase credentials are:
- **URL**: `https://xgnewppqxqkyeabtmenf.supabase.co`
- **Anon Key**: Already in Railway ✅
- **Service Role Key**: Already in Railway ✅

**Nothing to add in Supabase dashboard** - it's already configured!

---

## 3️⃣ LOCAL DEVELOPMENT (.env files)

### ✅ Already Created for You:

**backend/.env** - Already has everything ✅
**frontend/.env** - Just created with Supabase keys ✅
**landing-site/.env** - Already has everything ✅

### For Production Deployment:

When you're ready to deploy to GitHub Pages, update these files:

**frontend/.env** - Change these lines:
```bash
NEXT_PUBLIC_API_URL=https://ratemyprof-production.up.railway.app/v1
NEXT_PUBLIC_APP_URL=https://app.ratemyprof.me
NEXT_PUBLIC_LANDING_URL=https://ratemyprof.me
```

**landing-site/.env** - Change these lines:
```bash
VITE_API_BASE_URL=https://ratemyprof-production.up.railway.app/v1
VITE_APP_URL=https://app.ratemyprof.me
VITE_LANDING_URL=https://ratemyprof.me
```

---

## 🎯 Summary

### RAILWAY (Add These Now):
✅ Copy the entire block above into Railway Raw Editor
❌ Delete the old `RATE_LIMIT_ATTEMPTS` variable

### SUPABASE:
✅ Nothing to do - already configured!

### LOCAL FILES:
✅ All .env files are ready for development
⏳ Update URLs for production deployment later

---

## 🔍 Quick Check

After adding to Railway:

1. Go to Railway Dashboard
2. Check Variables tab
3. You should see **21 variables** total
4. Railway will auto-redeploy (takes ~2 minutes)
5. Check logs to verify no errors

---

## 📍 Your Railway URL

Your backend is deployed at:
```
https://ratemyprof-production.up.railway.app
```

This URL is already configured in your production setup above! ✅

---

**That's it! Everything else is already configured.** 🎊
