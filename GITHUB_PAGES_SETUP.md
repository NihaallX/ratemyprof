# GitHub Pages Deployment Guide

## What You Need to Do

### Step 1: Configure GitHub Repository Settings

1. **Go to your GitHub repository**: https://github.com/NihaallX/ratemyprof
2. **Click on "Settings"** tab
3. **Scroll down to "Pages"** in the left sidebar
4. Under **"Build and deployment"**:
   - Source: Select **"GitHub Actions"** (not "Deploy from a branch")
5. **Click Save**

### Step 2: Add Required Secrets

Your Next.js app needs environment variables. Add these as GitHub Secrets:

1. Go to **Settings > Secrets and variables > Actions**
2. Click **"New repository secret"** for each:

   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - Example: `https://xgnewppqxqkyeabtmenf.supabase.co`
   
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
     - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
     - For now, you can use: `https://your-backend-url.com/v1`
     - **NOTE**: GitHub Pages can only host your FRONTEND. Your backend needs separate hosting!

### Step 3: Configure Your Custom Domain (Namecheap)

#### In Namecheap:

1. Go to **Domain List** > Click **"Manage"** next to your domain
2. Click **"Advanced DNS"** tab
3. Add these DNS records:

   **For Root Domain (example.com):**
   ```
   Type: A Record
   Host: @
   Value: 185.199.108.153
   TTL: Automatic
   ```
   
   **Add these additional A records:**
   ```
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   **For WWW Subdomain:**
   ```
   Type: CNAME Record
   Host: www
   Value: NihaallX.github.io
   TTL: Automatic
   ```

4. **Remove** any existing A or CNAME records that conflict

#### In GitHub:

1. Go back to **Settings > Pages**
2. Under **"Custom domain"**, enter your domain (e.g., `yourdomain.com`)
3. Click **Save**
4. Wait a few minutes, then check **"Enforce HTTPS"** (might take 24-48 hours for DNS to propagate)

### Step 4: Push Your Changes

```bash
git add .
git commit -m "feat: Configure GitHub Pages deployment with custom domain"
git push origin 001-ratemyprof-india-platform
```

Then merge into main:
```bash
git checkout main
git merge 001-ratemyprof-india-platform
git push origin main
```

The workflow will automatically run and deploy your site!

---

## Important Notes

### ⚠️ Backend Hosting Problem

**GitHub Pages can ONLY host static websites (HTML, CSS, JavaScript).**

Your Python/FastAPI backend **cannot** run on GitHub Pages. You need to host it separately:

**Free Options for Backend:**
1. **Railway.app** (Free tier available)
   - Best for FastAPI apps
   - Easy PostgreSQL integration
   - Command: Connect GitHub, deploy automatically

2. **Render.com** (Free tier available)
   - Good for Python apps
   - Free PostgreSQL database
   - Auto-deploys from GitHub

3. **Fly.io** (Free tier available)
   - Good for FastAPI
   - Global deployment
   - Command-line deployment

4. **Vercel** (Free tier)
   - Can host Next.js frontend AND serverless API routes
   - But you'd need to rewrite backend as Next.js API routes

**Recommended Solution:**
- **Frontend**: GitHub Pages (free, fast)
- **Backend**: Railway.app or Render.com (free tier)
- **Database**: Already on Supabase (perfect!)

---

## Troubleshooting

### "Workflow failed" Error

**Check the error:**
1. Go to **Actions** tab in GitHub
2. Click on the failed workflow
3. Click on the failed job (usually "build" or "deploy")
4. Read the error message

**Common issues:**

1. **"Missing environment variables"**
   - Solution: Add secrets in Settings > Secrets (see Step 2)

2. **"Build failed - cannot find module"**
   - Solution: Make sure `package-lock.json` is committed
   - Run: `git add frontend/package-lock.json && git commit -m "Add package-lock" && git push`

3. **"Pages not enabled"**
   - Solution: Go to Settings > Pages and select "GitHub Actions" as source

4. **"404 - There isn't a GitHub Pages site here"**
   - Solution: Wait 5-10 minutes after first deployment
   - Check if custom domain DNS has propagated (use https://dnschecker.org)

### Custom Domain Not Working

1. **DNS not propagated yet**: Wait 24-48 hours
2. **Check DNS**: Use https://dnschecker.org with your domain
3. **HTTPS Certificate pending**: GitHub needs to verify domain first (can take hours)
4. **Wrong CNAME**: Make sure it points to `NihaallX.github.io` (not `NihaallX.github.io/ratemyprof`)

### Site Loads but API Calls Fail

This is because your backend isn't hosted yet!

1. **Quick fix for testing**: Update `NEXT_PUBLIC_API_URL` to point to `http://localhost:8000/v1` and run backend locally
2. **Real fix**: Deploy backend to Railway/Render, then update `NEXT_PUBLIC_API_URL` secret in GitHub

---

## What Happens After Deployment

1. **Every push to `main` branch** triggers automatic deployment
2. **Build takes 2-5 minutes**
3. **Site updates at your custom domain**
4. **You can see progress** in Actions tab

---

## Next Steps

### Immediate:
1. ✅ Configure GitHub Pages settings (Step 1)
2. ✅ Add environment secrets (Step 2)
3. ✅ Configure Namecheap DNS (Step 3)
4. ✅ Push and merge to main (Step 4)

### Within 24 hours:
5. 🚀 Deploy backend to Railway.app or Render.com
6. 🔗 Update `NEXT_PUBLIC_API_URL` secret with production backend URL
7. ✅ Enable HTTPS on GitHub Pages (once DNS propagates)

### Testing:
- Visit your domain (might take 24-48 hours for DNS)
- Visit `https://NihaallX.github.io/ratemyprof` (works immediately after deployment)

---

## Quick Backend Deployment (Railway.app)

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" > "Deploy from GitHub repo"
4. Select `NihaallX/ratemyprof`
5. Select `backend` folder
6. Add environment variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - All other env vars from your `.env` file
7. Deploy!
8. Copy the Railway URL (e.g., `https://ratemyprof-backend.up.railway.app`)
9. Update GitHub secret `NEXT_PUBLIC_API_URL` to this URL + `/v1`

---

## Need Help?

Check the error in GitHub Actions and share the error message. Common errors are easy to fix once we see them!
