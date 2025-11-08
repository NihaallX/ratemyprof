# Railway Environment Variables - Complete Setup

## ✅ Current Variables (You Already Have These)
```bash
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
```

---

## ⚠️ CRITICAL - Add These Missing Variables

### 1. **ENVIRONMENT** (Production Mode)
```bash
ENVIRONMENT="production"
```
**Why:** Controls production features like:
- TrustedHostMiddleware activation
- Debug mode toggle
- Error detail exposure
- Auto-reload behavior

---

### 2. **PORT** (Railway Requirement)
```bash
PORT="8000"
```
**Why:** Railway needs to know which port your app listens on. Railway automatically provides `PORT` but it's good to have a default.

---

### 3. **REFRESH_TOKEN_EXPIRE_DAYS** (Optional but Recommended)
```bash
REFRESH_TOKEN_EXPIRE_DAYS="7"
```
**Why:** Controls how long refresh tokens last (default is 7 days if not set)

---

### 4. **RATE_LIMIT_LOGIN_ATTEMPTS** (Typo Fix)
You have: `RATE_LIMIT_ATTEMPTS`  
Should be: `RATE_LIMIT_LOGIN_ATTEMPTS`

**Change this:**
```bash
# OLD (remove this)
RATE_LIMIT_ATTEMPTS="5"

# NEW (add this)
RATE_LIMIT_LOGIN_ATTEMPTS="5"
```

---

## 📋 Complete Railway Environment Variables

Copy and paste these into Railway (replace your current setup):

```bash
# === ENVIRONMENT ===
ENVIRONMENT="production"
PORT="8000"

# === SUPABASE CONFIGURATION ===
SUPABASE_URL="https://xgnewppqxqkyeabtmenf.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDEyOTQsImV4cCI6MjA3MzUxNzI5NH0.bQE3Pc4pdaRfv1YWeK-6q_osSc8eLnJuQh5nJDarDCk"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MTI5NCwiZXhwIjoyMDczNTE3Mjk0fQ.zXqhq-2wWioFz6jMGcL_hVmsuuqxbPQbxiImFjGvZzk"

# === ADMIN CREDENTIALS ===
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$12$FZd1vfjg04VLqXMdQf.Noes21XD9UoeuyYYLm2o1uZRknrXDoEody"

# === JWT CONFIGURATION ===
JWT_SECRET_KEY="jqVcjfb0k8_vVHVLrEEhB0OoMBGllh1rCyq6KlFt75p8kG9138ybecyK-uIe1Yml8pk_wkfp95h2w6Jb8d0apw"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"
REFRESH_TOKEN_EXPIRE_DAYS="7"

# === CORS CONFIGURATION ===
ALLOWED_ORIGINS="https://ratemyprof.me,https://app.ratemyprof.me,https://www.ratemyprof.me"

# === RATE LIMITING ===
RATE_LIMIT_LOGIN_ATTEMPTS="5"
RATE_LIMIT_WINDOW_MINUTES="15"

# === IP BANNING (AUTO-BAN) ===
AUTO_BAN_ENABLED="true"
BAN_THRESHOLD_FAILED_LOGINS="10"
BAN_THRESHOLD_RAPID_REQUESTS="100"
BAN_DURATION_MINUTES="60"
REQUESTS_WINDOW_SECONDS="60"
WHITELIST_IPS=""

# === API DOCUMENTATION ===
DOCS_ENABLED="false"
```

---

## 🔧 How to Update Railway Variables

### Option 1: Railway Dashboard (Recommended)
1. Go to https://railway.app
2. Click on your project
3. Click on your backend service
4. Go to "Variables" tab
5. Click "Raw Editor" button
6. Paste the complete variable list above
7. Click "Save"
8. Railway will automatically redeploy

### Option 2: Railway CLI
```bash
railway variables set ENVIRONMENT="production"
railway variables set PORT="8000"
railway variables set REFRESH_TOKEN_EXPIRE_DAYS="7"
railway variables set RATE_LIMIT_LOGIN_ATTEMPTS="5"
```

---

## 🌐 GitHub Pages Configuration

Since you mentioned GitHub Pages, here's what you need:

### For Landing Site (ratemyprof.me)
Create a `.env.production` file in `landing-site/`:
```bash
VITE_API_BASE_URL=https://ratemyprof-production.up.railway.app/v1
VITE_APP_URL=https://app.ratemyprof.me
VITE_LANDING_URL=https://ratemyprof.me
```

### For Frontend App (app.ratemyprof.me)
Create a `.env.production` file in `frontend/`:
```bash
NEXT_PUBLIC_API_URL=https://ratemyprof-production.up.railway.app/v1
NEXT_PUBLIC_APP_URL=https://app.ratemyprof.me
NEXT_PUBLIC_LANDING_URL=https://ratemyprof.me
NEXT_PUBLIC_SUPABASE_URL=https://xgnewppqxqkyeabtmenf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDEyOTQsImV4cCI6MjA3MzUxNzI5NH0.bQE3Pc4pdaRfv1YWeK-6q_osSc8eLnJuQh5nJDarDCk
```

**Note:** If using GitHub Pages for hosting, you'll need to build with these environment variables:

```bash
# Build landing-site
cd landing-site
npm install
npm run build
# Deploy dist/ folder to GitHub Pages

# Build frontend
cd ../frontend
npm install
npm run build
npm run export  # For static export if needed
# Deploy out/ or .next/ folder to GitHub Pages
```

---

## ⚡ Railway-Specific Notes

### Railway Auto-Provides These:
- `PORT` - Railway assigns a port dynamically (but 8000 is your default)
- `RAILWAY_ENVIRONMENT` - You can check this instead of `ENVIRONMENT`

### Railway URL:
Your Railway backend will be at:
```
https://your-project-name.up.railway.app
```

Make sure your `ALLOWED_ORIGINS` includes this Railway URL when testing!

---

## 🔍 Verification Checklist

After adding the variables and redeploying:

- [ ] Railway deployment succeeds without errors
- [ ] Check Railway logs: `railway logs`
- [ ] Visit: `https://your-railway-url.up.railway.app/health`
- [ ] Should return: `{"status": "healthy", "environment": "production"}`
- [ ] Test CORS: Visit your frontend and check if API calls work
- [ ] Test authentication: Try to sign in/sign up

---

## 🚨 Troubleshooting

### If Railway deployment fails:
```bash
# Check logs
railway logs

# Common issues:
# 1. PORT not set - Add PORT="8000"
# 2. ENVIRONMENT not set - Add ENVIRONMENT="production"
# 3. Missing quotes around values - Use "value" format
```

### If CORS errors appear:
- Verify `ALLOWED_ORIGINS` includes your exact GitHub Pages URLs
- Check browser console for exact origin being blocked
- Add that origin to `ALLOWED_ORIGINS` comma-separated

### If authentication fails:
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check frontend has same Supabase credentials
- Verify `JWT_SECRET_KEY` is the same across all deployments

---

## ✅ Final Check

After updating Railway variables:
1. Variables saved ✓
2. Railway redeployed automatically ✓
3. Check logs for startup errors ✓
4. Test health endpoint ✓
5. Test from frontend ✓
6. Authentication works ✓

You're all set! 🚀
