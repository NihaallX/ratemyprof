# 🚀 Deployment Instructions

## Changes Made ✅

### 1. Fixed CORS Issue
**File:** `backend/src/main.py`

Added the following domains to the CORS allowed origins:
- `https://ratemyprof.me` (Production custom domain - HTTPS)
- `http://ratemyprof.me` (Production custom domain - HTTP)

This allows your frontend at ratemyprof.me to communicate with your backend API.

### 2. Updated Branding
**Files Changed:**
- `frontend/src/pages/index.tsx` - Homepage header logo
- `frontend/src/components/Footer.tsx` - Footer logo
- `frontend/src/pages/auth/login.tsx` - Login page logo

Changed "RateMyProf.in" → "RateMyProf" in all visible logo instances.

**Note:** Email addresses like `admin@ratemyprof.in`, `privacy@ratemyprof.in` were kept as-is since they're functional email addresses.

---

## 🔧 Deployment Steps

### Option 1: If using Railway for Backend

1. **Railway will automatically deploy** when you push to main branch
2. Wait for deployment to complete (usually 2-5 minutes)
3. Check Railway logs to ensure no errors
4. Test the API endpoint: `https://ratemyprof-production.up.railway.app/health`

### Option 2: If using a different backend hosting

You need to redeploy your backend with the updated `main.py` file:

```bash
# SSH into your server or use your deployment method
git pull origin main
# Restart your backend service
```

### For Frontend (if deployed separately)

If your frontend is deployed on Vercel, Netlify, or similar:

1. The deployment should trigger automatically from the GitHub push
2. Or manually trigger a redeploy from your hosting dashboard
3. Wait for build to complete

---

## ✅ Verification Steps

### 1. Test Backend CORS
Open your browser console on `https://ratemyprof.me` and run:

```javascript
fetch('https://ratemyprof-production.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

You should see the health response, NOT a CORS error.

### 2. Test Frontend API Calls
1. Visit `https://ratemyprof.me`
2. Open browser console (F12)
3. Try searching for a professor or college
4. You should NOT see any CORS errors
5. Data should load successfully

### 3. Verify Logo Changes
1. Visit `https://ratemyprof.me`
2. Check that the logo says "RateMyProf" (not "RateMyProf.in")
3. Check the footer logo
4. Check the login page logo at `/auth/login`

---

## 🐛 Troubleshooting

### Still seeing CORS errors?

**Possible causes:**

1. **Backend not redeployed yet**
   - Check your Railway/hosting dashboard
   - Ensure the latest commit is deployed
   - Check deployment logs for errors

2. **Browser cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache completely

3. **Service worker cache**
   - Open DevTools → Application → Service Workers
   - Click "Unregister" if any are registered
   - Refresh the page

4. **Wrong API URL**
   - Check your frontend's API_URL environment variable
   - Should be `https://ratemyprof-production.up.railway.app/v1`

### Logo not updating?

1. **Frontend not rebuilt**
   - Check your frontend hosting dashboard
   - Manually trigger a rebuild if needed

2. **Browser cache**
   - Hard refresh the page
   - Clear browser cache

3. **CDN cache (if using Cloudflare/similar)**
   - Purge CDN cache
   - Or wait for cache to expire (usually 5-30 minutes)

---

## 📝 Changes Summary

```diff
backend/src/main.py:
+ "https://ratemyprof.me",  # Production custom domain
+ "http://ratemyprof.me",   # Production custom domain (http)

frontend/src/pages/index.tsx:
- RateMyProf.in
+ RateMyProf

frontend/src/components/Footer.tsx:
- RateMyProf.in
+ RateMyProf

frontend/src/pages/auth/login.tsx:
- RateMyProf.in
+ RateMyProf
```

---

## 🎉 Expected Results

After successful deployment:

✅ No CORS errors in browser console  
✅ Professors search works  
✅ Colleges search works  
✅ Login/signup works  
✅ Logo displays as "RateMyProf" everywhere  
✅ All API calls succeed  

---

## 📞 Need Help?

If issues persist after following these steps:

1. Check Railway deployment logs
2. Check browser console for specific error messages
3. Verify environment variables are set correctly
4. Test the backend health endpoint directly
5. Test the frontend build locally first

---

**Last Updated:** October 21, 2025  
**Commit:** 38f01c4
