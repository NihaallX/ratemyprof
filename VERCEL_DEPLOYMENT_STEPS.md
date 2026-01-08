# 🚀 Vercel Deployment - Quick Steps

## ✅ Step 1: Code is Ready (DONE)
Your Vercel configuration files are committed and pushed to GitHub.

## 🎯 Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com/login)**
   - Login with GitHub

2. **Click "Add New..." → "Project"**

3. **Import Repository:**
   - Find `NihaallX/ratemyprof`
   - Click "Import"

4. **Configure Project:**
   ```
   Project Name: ratemyprof-backend
   Framework Preset: Other
   Root Directory: backend
   Build Command: (leave empty)
   Output Directory: (leave empty)
   Install Command: pip install -r requirements.txt
   ```

5. **Add Environment Variables** (Click "Environment Variables"):
   
   Copy from your `backend/.env` file:
   
   ```env
   SUPABASE_URL=https://xgnewppqxqkyeabtmenf.supabase.co
   
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDEyOTQsImV4cCI6MjA3MzUxNzI5NH0.bQE3Pc4pdaRfv1YWeK-6q_osSc8eLnJuQh5nJDarDCk
   
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmV3cHBxeHFreWVhYnRtZW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk0MTI5NCwiZXhwIjoyMDczNTE3Mjk0fQ.zXqhq-2wWioFz6jMGcL_hVmsuuqxbPQbxiImFjGvZzk
   
   JWT_SECRET_KEY=jqVcjfb0k8_vVHVLrEEhB0OoMBGllh1rCyq6KlFt75p8kG9138ybecyK-uIe1Yml8pk_wkfp95h2w6Jb8d0apw
   
   ADMIN_USERNAME=admin
   
   ADMIN_PASSWORD_HASH=$2b$12$lfZ5l8wNvIAuxiGqDG8cF.8NM43xVHFX8AcNj0Z35kFTRfG3YNpoe
   
   ALLOWED_ORIGINS=https://ratemyprof.me,https://www.ratemyprof.me,http://localhost:3000
   
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   
   ALGORITHM=HS256
   
   REFRESH_TOKEN_EXPIRE_DAYS=7
   ```

6. **Click "Deploy"** 🚀

7. **Wait for deployment** (2-3 minutes)

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from backend directory
cd backend
vercel

# Add environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
# ... (add all variables)

# Deploy to production
vercel --prod
```

## 🌐 Step 3: Connect Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Add Domain"
   - Enter: `api.ratemyprof.me`

2. **Update DNS at your domain registrar:**
   
   Vercel will show you what to add. Typically:
   
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   TTL: 3600 (or Auto)
   ```

3. **Wait 5-30 minutes for DNS propagation**

4. **SSL automatically configured** ✅

## 🔄 Step 4: Update Frontend to Use Vercel

Once your Vercel deployment is live, run this script:

### If using custom domain (api.ratemyprof.me):
```powershell
.\update-backend-url.ps1 "https://api.ratemyprof.me"
```

### If using Vercel default domain:
```powershell
.\update-backend-url.ps1 "https://your-project-name.vercel.app"
```

This will automatically update:
- `frontend/.env`
- `frontend/src/config/api.ts`
- `frontend/src/components/MaintenanceBanner.tsx`

## ✅ Step 5: Deploy Updated Frontend

```bash
# Review changes
git diff

# Commit and push
git add .
git commit -m "Update backend URL to Vercel"
git push origin main
```

Your GitHub Pages will automatically rebuild with the new backend URL!

## 🧪 Step 6: Test Everything

1. **Visit your site:** https://ratemyprof.me
2. **Open DevTools Console** (F12)
3. **Check for CORS errors** (should be gone!)
4. **Test key features:**
   - Search professors
   - View reviews
   - Submit a review (if logged in)
   - Check notifications

## 🗑️ Step 7: Shut Down Railway

**Only after confirming everything works for 24-48 hours:**

1. Go to Railway dashboard
2. Select your project
3. Go to Settings
4. Click "Delete Service" or "Delete Project"

## 🎉 You're Done!

Your setup:
- ✅ Frontend: GitHub Pages (ratemyprof.me)
- ✅ Backend: Vercel (api.ratemyprof.me)
- ✅ Database: Supabase (unchanged)
- ✅ Custom domain with SSL
- ✅ Auto-deployments on git push

## 🆘 Troubleshooting

### Issue: "Module not found" errors on Vercel

**Solution:** Check that `backend/api/index.py` exists and has the correct content.

### Issue: CORS errors persist

**Solution:** 
1. Check Vercel environment variables
2. Make sure `ALLOWED_ORIGINS` includes `https://ratemyprof.me`
3. Redeploy: Vercel dashboard → Deployments → three dots → Redeploy

### Issue: 404 errors on Vercel

**Solution:**
1. Check `Root Directory` is set to `backend` in project settings
2. Check `backend/vercel.json` exists
3. Verify `backend/api/index.py` exists

### Issue: Domain not connecting

**Solution:**
1. Wait longer (DNS can take up to 48 hours, usually 5-30 minutes)
2. Check DNS records with: `nslookup api.ratemyprof.me`
3. Verify CNAME points to `cname.vercel-dns.com`

## 📊 Monitor Your Deployment

- **Vercel Dashboard:** https://vercel.com/dashboard
  - View deployments
  - Check logs
  - Monitor usage
  
- **Check logs for errors:**
  - Go to your project → Deployments
  - Click latest deployment
  - View "Function Logs"

## 🎯 Performance Tips

1. **Enable Caching:** Already configured in your code
2. **Use Edge Functions:** Consider enabling Vercel Edge Runtime for faster response times
3. **Monitor Analytics:** Enable Vercel Analytics in project settings
4. **Set up Alerts:** Configure Slack/email alerts for deployment failures

---

Need help? Check the full guide in `VERCEL_MIGRATION_GUIDE.md`
