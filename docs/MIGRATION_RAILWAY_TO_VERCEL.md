# 🚀 Complete Guide: Railway Backend Deployment + GitHub Pages Frontend

## 📚 Table of Contents
1. [Understanding the Basics](#understanding-the-basics)
2. [What We Built](#what-we-built)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Testing Your Deployment](#testing-your-deployment)
5. [Troubleshooting](#troubleshooting)

---

## 🎓 Understanding the Basics

### What is Password Hashing?

**Simple Explanation:**
- **WITHOUT Hashing**: Storing password as `"NihalGaurav#2005!"` in database
  - ❌ If someone hacks your database, they can see your password directly
  
- **WITH Hashing**: Storing password as `"$2b$12$lfZ5l8wNvIAuxiGqDG8cF..."` in database
  - ✅ If someone hacks your database, they see gibberish
  - ✅ The hash can NEVER be reversed back to your original password
  - ✅ When you login, your password is hashed again and compared

**Example:**
```
Your Password: "NihalGaurav#2005!"
         ↓ (bcrypt hashing)
Stored Hash: "$2b$12$lfZ5l8wNvIAuxiGqDG8cF.8NM43xVHFX8AcNj0Z35kFTRfG3YNpoe"

When you login:
1. You type: "NihalGaurav#2005!"
2. System hashes it: "$2b$12$lfZ5l8wNvIAuxiGqDG8cF.8NM43xVHFX8AcNj0Z35kFTRfG3YNpoe"
3. System compares: Stored Hash == Login Hash? ✅ YES → Login successful!
```

### What is bcrypt?

**bcrypt** is a special hashing algorithm that:
- Takes 12 "rounds" (makes it slow on purpose to prevent hackers from trying millions of passwords)
- Automatically adds "salt" (random data to make each hash unique)
- Is industry-standard and very secure

### What We Fixed in Your Project

**BEFORE (INSECURE):**
```python
# In your code (VISIBLE TO ANYONE):
ADMIN_PASSWORD = "admin123"  # ❌ TERRIBLE!

# When someone logs in:
if password == "admin123":  # ❌ Plain text comparison
    login_success()
```

**AFTER (SECURE):**
```python
# In environment variable (NOT in code):
ADMIN_PASSWORD_HASH = "$2b$12$lfZ5l8w..."  # ✅ Hashed!

# When someone logs in:
if bcrypt.checkpw(password, ADMIN_PASSWORD_HASH):  # ✅ Secure comparison
    login_success()
```

---

## 🏗️ What We Built

### Files Created/Modified:

1. **backend/.env** ← Your ACTUAL secrets (NEVER commit to GitHub)
2. **backend/src/config/security.py** ← Loads secrets from .env
3. **backend/src/api/moderation.py** ← Admin login with rate limiting
4. **backend/src/main.py** ← CORS restrictions, security headers
5. **frontend/src/pages/admin/login.tsx** ← Admin login page
6. **railway.json** ← Railway deployment config
7. **vercel.json** ← Vercel deployment config
8. **.railwayignore** ← Prevents Railway from serving unwanted files

### Security Features Added:

✅ **Password Hashing (bcrypt)** - Your password is stored as unreadable hash  
✅ **Environment Variables** - Secrets not in code, only in .env file  
✅ **JWT Token Expiration** - Tokens expire after 24 hours  
✅ **Rate Limiting** - Only 5 login attempts per 15 minutes per IP  
✅ **CORS Restrictions** - Only your domains can call the API  
✅ **Security Headers** - Protects against XSS, clickjacking, etc.  
✅ **/docs Disabled** - API documentation hidden in production  

---

## 🚂 Step-by-Step Migration

### Current Setup:
- **Railway**: Hosts your backend (FastAPI Python server)
- **GitHub Pages**: Hosts your frontend (Next.js React app - static export)

---

## 📋 Deployment Steps

### A. Fix Railway Backend (Current Issues)

#### Step 1: Set Environment Variables in Railway

1. Go to: https://railway.app/dashboard
2. Select your `ratemyprof` project
3. Click on your backend service
4. Go to **"Variables"** tab
5. Click **"New Variable"** and add these ONE BY ONE:

```bash
# Copy these EXACTLY:

ADMIN_USERNAME=admin

ADMIN_PASSWORD_HASH=$2b$12$lfZ5l8wNvIAuxiGqDG8cF.8NM43xVHFX8AcNj0Z35kFTRfG3YNpoe

JWT_SECRET_KEY=jqVcjfb0k8_vVHVLrEEhB0OoMBGllh1rCyq6KlFt75p8kG9138ybecyK-uIe1Yml8pk_wkfp95h2w6Jb8d0apw

SUPABASE_URL=https://xgnewppqxqkyeabtmenf.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDEyOTQsImV4cCI6MjA3MzUxNzI5NH0.bQE3Pc4pdaRfv1YWeK-6q_osSc8eLnJuQh5nJDarDCk

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MTI5NCwiZXhwIjoyMDczNTE3Mjk0fQ.zXqhq-2wWioFz6jMGcL_hVmsuuqxbPQbxiImFjGvZzk

ALLOWED_ORIGINS=https://ratemyprof.me,https://www.ratemyprof.me,http://localhost:3000

ACCESS_TOKEN_EXPIRE_MINUTES=1440

RATE_LIMIT_ATTEMPTS=5

RATE_LIMIT_WINDOW_MINUTES=15

DOCS_ENABLED=false

ALGORITHM=HS256
```

6. Click **"Deploy"** (Railway will restart with new variables)

#### Step 2: Update Railway Deployment Settings

1. In Railway dashboard, go to **"Settings"** tab
2. Under **"Deploy"**, check:
   - **Root Directory**: Should be `/` (root of repo)
   - **Build Command**: Should auto-detect from `railway.json`
   - **Start Command**: Should be `cd backend && uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000} --no-access-log`

3. Scroll down to **"Domains"**
   - Copy your Railway domain (e.g., `yourapp.railway.app`)
   - We'll use this in Vercel config

#### Step 3: Verify Railway Deployment

After Railway redeploys (takes ~2-3 minutes):

1. Test health endpoint:
   ```
   https://your-app.railway.app/health
   ```
   Should return:
   ```json
   {"status": "healthy"}
   ```
   
   ❌ If it shows GitHub files → Check `.railwayignore` is committed

2. Test admin login:
   ```bash
   # In Postman or curl:
   POST https://your-app.railway.app/api/moderation/admin/login
   Body: {
     "username": "admin",
     "password": "NihalGaurav#2005!"
   }
   ```
   Should return:
   ```json
   {
     "access_token": "eyJ...",
     "token_type": "bearer"
   }
   ```

---

### B. Deploy Frontend to Vercel

#### Step 1: Connect Vercel to GitHub

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `ratemyprof` repository
4. Vercel will detect it's a monorepo

#### Step 2: Configure Frontend Build

1. **Framework Preset**: Next.js
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `.next` (auto-detected)
5. **Install Command**: `npm install` (auto-detected)

#### Step 3: Set Environment Variables in Vercel

1. In Vercel project settings → **"Environment Variables"**
2. Add these variables:

```bash
# Frontend needs to know where the backend is:

NEXT_PUBLIC_API_URL=https://your-app.railway.app

NEXT_PUBLIC_SUPABASE_URL=https://xgnewppqxqkyeabtmenf.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDEyOTQsImV4cCI6MjA3MzUxNzI5NH0.bQE3Pc4pdaRfv1YWeK-6q_osSc8eLnJuQh5nJDarDCk
```

**IMPORTANT**: 
- `NEXT_PUBLIC_` prefix makes these available in browser
- Only add `SUPABASE_ANON_KEY` here (NOT service role key - that stays in Railway)

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait ~2-3 minutes for build
3. Vercel will give you URLs:
   - Preview: `ratemyprof-xyz.vercel.app`
   - Production (after adding domain): `ratemyprof.me`

#### Step 5: Add Custom Domain

1. In Vercel → **"Settings"** → **"Domains"**
2. Add: `ratemyprof.me`
3. Add: `www.ratemyprof.me`
4. Vercel will show DNS records to add:

**In your domain registrar (GoDaddy/Namecheap/etc.):**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

5. Wait 5-60 minutes for DNS propagation

---

### C. Update CORS Settings

Now that you have Vercel URL, update Railway:

1. Go to Railway → Variables
2. Update `ALLOWED_ORIGINS`:
   ```
   https://ratemyprof.me,https://www.ratemyprof.me,https://ratemyprof-xyz.vercel.app,http://localhost:3000
   ```
3. Click **"Deploy"** to restart

---

## 🧪 Testing Your Deployment

### Test Checklist:

#### 1. Backend (Railway)
```bash
# Health check
curl https://your-app.railway.app/health
# Should return: {"status": "healthy"}

# Admin login
curl -X POST https://your-app.railway.app/api/moderation/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"NihalGaurav#2005!"}'
# Should return: {"access_token": "...", "token_type": "bearer"}

# Rate limiting test (try 6 times quickly)
# 6th attempt should return: 429 Too Many Requests
```

#### 2. Frontend (Vercel)
```bash
# Visit these URLs:
https://ratemyprof.me → Homepage loads ✅
https://ratemyprof.me/admin/login → Admin login page loads ✅
```

#### 3. Integration Test
1. Go to `https://ratemyprof.me/admin/login`
2. Enter:
   - Username: `admin`
   - Password: `NihalGaurav#2005!`
3. Should redirect to admin dashboard
4. Try wrong password → Should show error
5. Try 6 wrong passwords → Should block you for 15 minutes

---

## 🐛 Troubleshooting

### Issue: "Health endpoint shows GitHub files"

**Cause**: Railway is serving static files from root directory

**Fix**:
1. Make sure `.railwayignore` is committed and pushed
2. In Railway → Settings → Check "Root Directory" is `/`
3. Redeploy

### Issue: "CORS error when calling API from Vercel"

**Cause**: Frontend domain not in `ALLOWED_ORIGINS`

**Fix**:
1. Railway → Variables → Update `ALLOWED_ORIGINS`
2. Add your Vercel URL: `https://your-app.vercel.app`
3. Redeploy Railway

### Issue: "Admin login returns 401 Unauthorized"

**Cause**: Environment variables not set correctly

**Fix**:
1. Check Railway → Variables → Make sure ALL variables are set
2. Especially check: `ADMIN_PASSWORD_HASH`, `JWT_SECRET_KEY`
3. Redeploy Railway

### Issue: "Can't login, getting 500 error"

**Cause**: Bcrypt not installed or password hash format wrong

**Fix**:
1. Check Railway logs: Settings → View Logs
2. Look for error message
3. Ensure `bcrypt` is in `backend/requirements.txt`
4. Redeploy

---

## 📝 Summary

### What You Now Have:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  User visits: https://ratemyprof.me            │
│                       ↓                         │
│              ┌────────────────┐                 │
│              │  Vercel CDN    │                 │
│              │  (Frontend)    │                 │
│              │  Next.js App   │                 │
│              └────────┬───────┘                 │
│                       ↓                         │
│              API calls to:                      │
│       https://your-app.railway.app/api          │
│                       ↓                         │
│              ┌────────────────┐                 │
│              │  Railway       │                 │
│              │  (Backend)     │                 │
│              │  FastAPI       │                 │
│              └────────┬───────┘                 │
│                       ↓                         │
│              ┌────────────────┐                 │
│              │   Supabase     │                 │
│              │   Database     │                 │
│              └────────────────┘                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Security Implemented:

✅ Passwords hashed with bcrypt (can never be reversed)  
✅ Environment variables (secrets not in code)  
✅ Rate limiting (5 attempts per 15min)  
✅ CORS restrictions (only your domains allowed)  
✅ JWT tokens expire (24h limit)  
✅ Security headers (XSS, clickjacking protection)  
✅ /docs endpoint disabled (no API leak)  

---

## 🎉 You're Done!

Your site is now:
- ✅ **Fast**: Vercel CDN for frontend
- ✅ **Secure**: bcrypt hashing, rate limiting, CORS
- ✅ **Scalable**: Railway backend, Supabase database
- ✅ **Professional**: Custom domain, SSL certificates

**Login credentials:**
- Username: `admin`
- Password: `NihalGaurav#2005!`

**Admin dashboard:** https://ratemyprof.me/admin/login

---

## 🚨 IMPORTANT REMINDERS

1. ❌ **NEVER** commit `backend/.env` file to GitHub
2. ❌ **NEVER** share your `.env` file in screenshots/Discord/Slack
3. ✅ **ALWAYS** use environment variables for secrets
4. ✅ **REGULARLY** check Railway logs for suspicious activity
5. ✅ **CHANGE** your admin password every 3 months

If you need to change admin password:
```bash
# Run this in backend directory:
python -c "import bcrypt; print(bcrypt.hashpw(b'YourNewPassword', bcrypt.gensalt(12)).decode())"

# Copy the output
# Update ADMIN_PASSWORD_HASH in Railway variables
```

---

**Need help?** Check Railway logs or Vercel deployment logs for error messages.
