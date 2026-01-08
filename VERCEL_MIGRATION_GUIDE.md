# Vercel Migration Guide: Railway → Vercel

## Overview
This guide walks you through migrating your RateMyProf backend from Railway to Vercel while keeping your frontend on GitHub Pages with your custom domain `ratemyprof.me`.

## ✅ What You Get
- ✨ Custom domain `ratemyprof.me` for your backend API
- 🚀 Automatic deployments from GitHub
- 💰 Generous free tier (100GB bandwidth, 100GB-hours compute)
- 🌍 Edge network for faster responses globally
- 📊 Better analytics and monitoring

## 📋 Prerequisites
1. GitHub account (you already have this)
2. Vercel account (free) - [sign up here](https://vercel.com/signup)
3. Domain access to `ratemyprof.me` for DNS configuration

## 🔧 Migration Steps

### Step 1: Prepare Your Backend for Vercel

I've created the necessary files:
- ✅ `vercel.json` - Vercel configuration
- ✅ `backend/api/index.py` - Vercel entry point
- ✅ `backend/vercel.json` - Backend-specific config

### Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Easiest)

1. **Go to [vercel.com](https://vercel.com) and login**

2. **Click "Add New Project"**

3. **Import your GitHub repository**
   - Select your `ratemyprof` repository
   - Vercel will auto-detect the project

4. **Configure the project:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Output Directory:** Leave empty
   - **Install Command:** Leave default

5. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   
   **Where to find these values:**
   - Go to your Railway project
   - Copy all environment variables starting with `SUPABASE_`
   - Or check your local `.env` file in the backend directory

6. **Click "Deploy"**

#### Option B: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Navigate to backend directory
cd backend

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? [your account]
# - Link to existing project? N
# - What's your project's name? ratemyprof-backend
# - In which directory is your code located? ./
```

### Step 4: Add Environment Variables (CLI Method)

```bash
# Add each variable
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Redeploy with environment variables
vercel --prod
```

### Step 5: Connect Your Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Click "Domains"
   - Click "Add Domain"
   - Enter: `api.ratemyprof.me` (or just `ratemyprof.me`)

2. **Update DNS Settings (at your domain registrar):**
   
   Vercel will show you what DNS records to add. Typically:
   
   **Option A: Use subdomain for API (Recommended)**
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```
   
   Your API will be at: `https://api.ratemyprof.me`
   
   **Option B: Use root domain**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME  
   Name: www
   Value: cname.vercel-dns.com
   ```
   
   Your API will be at: `https://ratemyprof.me`

3. **Wait for DNS propagation** (can take 5-48 hours, usually 5-10 minutes)

4. **Vercel will automatically provision SSL certificate**

### Step 6: Update Your Frontend

Update your frontend to point to the new Vercel backend URL:

**If using subdomain:**
```javascript
// In your frontend config/constants
const API_BASE_URL = 'https://api.ratemyprof.me';
```

**If using root domain:**
```javascript
const API_BASE_URL = 'https://ratemyprof.me';
```

**For development:**
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.ratemyprof.me'
  : 'http://localhost:8000';
```

### Step 7: Update CORS Settings

The backend is already configured with CORS in `src/main.py`. Verify these domains are allowed:

```python
ALLOWED_ORIGINS = [
    "https://yourusername.github.io",  # Your GitHub Pages URL
    "https://ratemyprof.me",           # Your custom domain
    "http://localhost:3000",           # Local development
]
```

### Step 8: Test Your Deployment

```bash
# Test health endpoint
curl https://api.ratemyprof.me/health

# Or visit in browser
# https://api.ratemyprof.me/docs (API documentation)
```

### Step 9: Shut Down Railway (After Testing)

1. Verify everything works on Vercel for 24-48 hours
2. Go to Railway dashboard
3. Delete your project or remove the service

## 🎯 Recommended Setup

**Best Practice: Use subdomain for API**

```
Frontend (GitHub Pages): https://ratemyprof.me
Backend (Vercel):        https://api.ratemyprof.me
```

**Benefits:**
- Clear separation of concerns
- Easier to manage CORS
- Can move backend later without affecting frontend URL
- More professional structure

## 🔍 Troubleshooting

### Issue: CORS Errors

**Solution:** Update `src/config/security.py` to include your Vercel domain:

```python
ALLOWED_ORIGINS = [
    "https://your-github-username.github.io",
    "https://ratemyprof.me",
    "https://www.ratemyprof.me",
]
```

### Issue: Environment Variables Not Loading

**Solution:** 
1. Check Vercel dashboard → Settings → Environment Variables
2. Make sure they're set for "Production", "Preview", and "Development"
3. Redeploy after adding variables

### Issue: Module Import Errors

**Solution:** Vercel uses serverless functions. The `backend/api/index.py` file handles path setup.

### Issue: Cold Start Delays

**Solution:** This is normal for serverless. First request after inactivity takes 2-3 seconds. Consider:
- Keep your endpoints lightweight
- Use caching for database queries
- Upgrade to Vercel Pro for faster cold starts

## 📊 Cost Comparison

### Railway (Current)
- Free tier: $5/month credit
- Costs: ~$5-20/month depending on usage

### Vercel (New)
- Free tier includes:
  - 100GB bandwidth/month
  - 100GB-hours compute/month
  - Unlimited API requests
  - Custom domains
  - SSL certificates
- Pro: $20/month (if you need more)

## 🚀 Post-Migration Checklist

- [ ] Backend deployed to Vercel
- [ ] Environment variables configured
- [ ] Custom domain connected
- [ ] SSL certificate active
- [ ] Frontend updated with new API URL
- [ ] CORS configured correctly
- [ ] All API endpoints tested
- [ ] Database connections working
- [ ] Authentication working
- [ ] Railway project archived/deleted

## 📝 Notes

- **Serverless Limitations:** 
  - Max execution time: 10 seconds (free tier), 60 seconds (Pro)
  - Max request body: 4.5 MB
  - Background jobs need different approach (use Vercel Cron or external service)

- **Database:** 
  - Your Supabase database stays the same
  - No migration needed for data
  - Just update connection strings if needed

- **Logs:** 
  - View logs in Vercel dashboard
  - Much better than Railway's log viewer

## 🎉 Benefits You'll Get

1. **Better Performance:** Edge network, global CDN
2. **Easier Deployments:** Git push = auto deploy
3. **Better DX:** Cleaner dashboard, better logs
4. **Custom Domain:** Use your ratemyprof.me domain
5. **Automatic HTTPS:** Free SSL certificates
6. **Preview Deployments:** Test changes before production

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Python on Vercel: https://vercel.com/docs/functions/serverless-functions/runtimes/python

---

**Ready to deploy?** Just follow the steps above and you'll be live in 15 minutes! 🚀
