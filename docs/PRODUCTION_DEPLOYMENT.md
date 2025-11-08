# Production Deployment Guide - RateMyProf.me

## Domain Structure

### Production URLs
- **Landing Page**: `https://ratemyprof.me` (port 3001 in dev)
- **Main App**: `https://app.ratemyprof.me` (port 3000 in dev)
- **Backend API**: `https://ratemyprof-production.up.railway.app` (port 8000 in dev)

### Development URLs
- **Landing Page**: `http://localhost:3001`
- **Main App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`

## Environment Variables

### Landing Site (landing-site/.env.production)
```env
VITE_API_BASE_URL=https://ratemyprof-production.up.railway.app/v1
VITE_APP_URL=https://app.ratemyprof.me
VITE_LANDING_URL=https://ratemyprof.me
```

### Frontend App (frontend/.env.production)
```env
NEXT_PUBLIC_API_URL=https://ratemyprof-production.up.railway.app/v1
NEXT_PUBLIC_APP_URL=https://app.ratemyprof.me
NEXT_PUBLIC_LANDING_URL=https://ratemyprof.me
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (backend/.env)
```env
DATABASE_URL=your_production_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_production_jwt_secret
CORS_ORIGINS=https://ratemyprof.me,https://app.ratemyprof.me
```

## Routing Logic

### User Flow
1. **New Visitor** → Lands on `ratemyprof.me` (Landing Page)
2. **Click "Get Started"** → Redirects to `app.ratemyprof.me/auth/signup`
3. **After Sign Up** → Stays on `app.ratemyprof.me` (Main App)
4. **Signed-in User** visiting `ratemyprof.me` → Redirects to `app.ratemyprof.me`
5. **Sign Out** → Redirects to `ratemyprof.me` (Landing Page)

### Browsing Without Auth
- Users can view professors, colleges, and reviews without signing in
- Login required for: writing reviews, voting, flagging content
- Auth modal appears when attempting protected actions

## Security Checklist

- ✅ No tokens in URLs or localStorage (using httpOnly cookies via Supabase)
- ✅ CORS properly configured for production domains
- ✅ Environment variables for sensitive data
- ✅ Session storage used only for redirect flow (no sensitive data)
- ✅ Secure authentication flow between landing and app

## Deployment Steps

### 1. Landing Site (Vercel/Netlify)
```bash
cd landing-site
npm run build
# Deploy dist folder to ratemyprof.me
```

### 2. Frontend App (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy .next folder to app.ratemyprof.me
```

### 3. Backend (Railway)
```bash
cd backend
# Railway auto-deploys on git push
git push origin main
```

## DNS Configuration

### Vercel/Netlify DNS Settings
```
Type  Name     Value
A     @        76.76.21.21 (Vercel IP)
CNAME app      cname.vercel-dns.com
CNAME www      cname.vercel-dns.com
```

## Testing Checklist

- [ ] New visitor lands on landing page
- [ ] Sign up flow: landing → app.ratemyprof.me/auth/signup → dashboard
- [ ] Sign in flow: landing → app.ratemyprof.me/auth/login → dashboard
- [ ] Signed-in user visiting landing page redirects to app
- [ ] No redirect loops between landing and app
- [ ] Unauthenticated browsing works (view professors/colleges)
- [ ] Protected actions show auth modal
- [ ] Sign out redirects to landing page
- [ ] Favicon shows on all pages
- [ ] Dark mode works on all pages
- [ ] Mobile UI responsive on all pages
- [ ] All animations smooth

## Post-Deployment Verification

1. Clear browser cache and cookies
2. Test as new visitor (incognito mode)
3. Test sign-up flow end-to-end
4. Test sign-in flow end-to-end  
5. Test protected actions without auth
6. Test mobile responsiveness
7. Verify all links work
8. Check browser console for errors
9. Test dark mode toggle
10. Verify favicon loads

## Rollback Plan

If issues occur:
1. Revert to previous git commit
2. Redeploy previous version
3. Check error logs in Railway/Vercel
4. Test locally with production API

## Monitoring

- Check Railway logs for backend errors
- Monitor Vercel analytics for frontend errors
- Set up error tracking (Sentry recommended)
- Monitor API response times
