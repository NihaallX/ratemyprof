# 🚀 Quick Deployment Guide - RateMyProf.me

## Production URLs
- 🏠 Landing: `https://ratemyprof.me`
- 📱 App: `https://app.ratemyprof.me`
- ⚙️ API: `https://ratemyprof-production.up.railway.app`

---

## Step 1: Deploy Backend (Railway)

```bash
git add .
git commit -m "Production deployment"
git push origin main
```

**Set Environment Variables in Railway:**
```
ALLOWED_ORIGINS=https://ratemyprof.me,https://app.ratemyprof.me,https://www.ratemyprof.me
ENVIRONMENT=production
DATABASE_URL=<your_database_url>
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_KEY=<service_key>
JWT_SECRET=<jwt_secret>
```

---

## Step 2: Deploy Landing (Vercel → ratemyprof.me)

```bash
cd landing-site
npm install
npm run build
```

**Vercel Project Settings:**
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Custom Domain: `ratemyprof.me`

**Environment Variables:**
```
VITE_API_BASE_URL=https://ratemyprof-production.up.railway.app/v1
VITE_APP_URL=https://app.ratemyprof.me
VITE_LANDING_URL=https://ratemyprof.me
```

---

## Step 3: Deploy Frontend (Vercel → app.ratemyprof.me)

```bash
cd frontend
npm install
npm run build
```

**Vercel Project Settings:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Custom Domain: `app.ratemyprof.me`

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://ratemyprof-production.up.railway.app/v1
NEXT_PUBLIC_APP_URL=https://app.ratemyprof.me
NEXT_PUBLIC_LANDING_URL=https://ratemyprof.me
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

---

## Step 4: Configure DNS

**Option A: Using Vercel DNS**
```
Type  Name  Value
A     @     76.76.21.21
CNAME app   cname.vercel-dns.com
CNAME www   cname.vercel-dns.com → redirect to @
```

**Option B: Using Custom DNS Provider**
- Point `ratemyprof.me` A record to Vercel IP
- Point `app.ratemyprof.me` CNAME to Vercel
- SSL certificates auto-configure

---

## Step 5: Verify Deployment

**Landing Page (ratemyprof.me):**
- ✅ Favicon appears in tab
- ✅ Stats load correctly
- ✅ Professor cards link work
- ✅ "Sign In" opens auth modal
- ✅ Dark mode works

**App (app.ratemyprof.me):**
- ✅ Search professors works
- ✅ View professor profiles
- ✅ Authentication flow works
- ✅ Sign out redirects to landing
- ✅ Protected actions require login

**Cross-Domain Flow:**
- ✅ Landing → Sign Up → App works
- ✅ App → Sign Out → Landing works
- ✅ Landing (authenticated) shows banner
- ✅ No redirect loops

---

## Step 6: Post-Launch Monitoring

**Check These Daily:**
- Railway backend logs (errors)
- Vercel analytics (traffic)
- Sign-up conversion rate
- API response times
- CORS or auth errors

**Set Up:**
- Sentry for error tracking
- UptimeRobot for uptime monitoring
- Google Analytics (optional)

---

## 🆘 Troubleshooting

**CORS Error:**
- Check `ALLOWED_ORIGINS` in Railway includes both domains
- Verify frontend is using correct API URL
- Check browser console for specific origin

**Auth Not Working:**
- Verify Supabase environment variables are correct
- Check if cookies are being set (Application tab in DevTools)
- Test in incognito mode (no cached sessions)

**Redirect Loop:**
- Clear browser cookies and localStorage
- Check `from_app` and `from_landing` flags in sessionStorage
- Verify landing page doesn't auto-redirect authenticated users

**404 on Routes:**
- Ensure Vercel rewrites are configured (Next.js handles automatically)
- Check if custom domain DNS has propagated (can take 24-48 hours)

---

## 🔄 Rollback Procedure

If critical issues:
```bash
git revert HEAD
git push origin main
```

Railway auto-deploys the reverted version.  
Redeploy previous builds in Vercel dashboard.

---

## ✅ Launch Checklist

- [ ] Backend deployed to Railway
- [ ] Landing deployed to Vercel (ratemyprof.me)
- [ ] Frontend deployed to Vercel (app.ratemyprof.me)
- [ ] DNS configured and propagated
- [ ] SSL certificates active
- [ ] All environment variables set
- [ ] Test sign-up flow
- [ ] Test sign-in flow
- [ ] Test sign-out flow
- [ ] Verify unauthenticated browsing
- [ ] Check mobile responsiveness
- [ ] Monitor error logs

---

**Need Help?**
- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support

**Documentation:**
- Full Guide: `PRODUCTION_DEPLOYMENT.md`
- Checklist: `PRE_PRODUCTION_CHECKLIST.md`
- Summary: `PRODUCTION_READY_SUMMARY.md`
