# Pre-Production Launch Checklist

## ✅ Completed Items

### 1. URL Configuration
- [x] Removed hardcoded `localhost:3001` from `frontend/src/pages/index.tsx`
- [x] Landing-site uses conditional logic for production domains
- [x] API configuration supports both dev and production URLs
- [x] Environment variable templates created (`.env.example`, `.env.production`)

### 2. Authentication & Routing
- [x] Landing page detects authenticated users and shows animated banner
- [x] Banner includes "Go to App" button (no auto-redirect to prevent loops)
- [x] Proper Supabase session detection using localStorage keys
- [x] `from_app` flag prevents redirect loop when user signs out
- [x] `from_landing` flag tracks authentication flow
- [x] Sign-out redirects to landing page with proper cleanup

### 3. Security
- [x] Supabase configured with `persistSession: true` (httpOnly cookies)
- [x] SessionStorage used only for non-sensitive flow flags
- [x] CORS configured for all production domains:
  - `https://ratemyprof.me`
  - `https://app.ratemyprof.me`
  - `http://localhost:3000` (dev)
  - `http://localhost:3001` (dev)
- [x] TrustedHostMiddleware includes app.ratemyprof.me
- [x] Protected actions check `user && session` before API calls
- [x] Auth modal shown for protected actions when not logged in

### 4. Unauthenticated Browsing
- [x] Users can view professors without login
- [x] Users can view colleges without login
- [x] Users can read reviews without login
- [x] ReviewVoting shows "Please log in" toast
- [x] FlagReviewButton shows "Please log in" toast
- [x] ReviewSubmissionForm requires authentication
- [x] CollegeReviewForm requires authentication
- [x] AddProfessorForm requires authentication

### 5. UI/UX Enhancements
- [x] Favicon copied to landing-site/public/
- [x] Landing page index.html updated with favicon links
- [x] Meta tags added for SEO and theme-color
- [x] Dark mode fully implemented on all pages
- [x] Professor cards have dark mode with colored shadows
- [x] Review criteria bars visible in dark mode
- [x] Voting buttons styled for dark mode
- [x] Search results section dark mode complete

## ⚠️ Items to Test Before Launch

### 6. Mobile Responsiveness
- [ ] Test on mobile devices (iOS, Android)
- [ ] Verify text visibility in dark mode on mobile
- [ ] Check touch interactions work properly
- [ ] Test hamburger menu functionality
- [ ] Verify modals display correctly on mobile
- [ ] Check professor cards responsive design
- [ ] Test search functionality on mobile

### 7. Complete User Flows
**New Visitor Flow:**
- [ ] 1. Visit `https://ratemyprof.me` (or localhost:3001)
- [ ] 2. Browse professors and reviews (no login required)
- [ ] 3. Try to submit a review → Auth modal appears
- [ ] 4. Click "Sign Up" → Redirected to app.ratemyprof.me/auth/signup
- [ ] 5. Complete sign-up → Lands on app dashboard
- [ ] 6. Submit a review successfully
- [ ] 7. Sign out → Redirected to ratemyprof.me

**Returning User Flow:**
- [ ] 1. Visit `https://ratemyprof.me` while authenticated
- [ ] 2. See animated green banner "Welcome back!"
- [ ] 3. Click "Go to App" → Redirected to app.ratemyprof.me
- [ ] 4. Browse professors, submit reviews
- [ ] 5. Sign out → Redirected to ratemyprof.me
- [ ] 6. No redirect loop, banner doesn't appear

**Direct App Access:**
- [ ] 1. Visit `https://app.ratemyprof.me` directly (not authenticated)
- [ ] 2. Can browse professors and reviews
- [ ] 3. Try protected action → Login prompt
- [ ] 4. Sign in → Stay on app
- [ ] 5. Continue browsing seamlessly

### 8. Dark Mode & Animations
- [ ] Test dark mode toggle on all pages
- [ ] Verify no white flashes on page load
- [ ] Check animations are smooth (no flickering)
- [ ] Verify colored shadows on professor cards
- [ ] Test review criteria bars visibility
- [ ] Check voting button states
- [ ] Verify modal animations work properly

### 9. Cross-Browser Testing
- [ ] Chrome/Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop & iOS)
- [ ] Chrome (Android)
- [ ] Test incognito mode in all browsers

## 🚀 Deployment Steps

### 10. Environment Variables Setup

**Railway (Backend):**
```bash
ALLOWED_ORIGINS=https://ratemyprof.me,https://app.ratemyprof.me,https://www.ratemyprof.me
ENVIRONMENT=production
DATABASE_URL=<your_production_db>
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_KEY=<your_service_key>
JWT_SECRET=<your_jwt_secret>
```

**Vercel/Netlify (Landing - ratemyprof.me):**
```bash
VITE_API_BASE_URL=https://ratemyprof-production.up.railway.app/v1
VITE_APP_URL=https://app.ratemyprof.me
VITE_LANDING_URL=https://ratemyprof.me
```

**Vercel/Netlify (Frontend - app.ratemyprof.me):**
```bash
NEXT_PUBLIC_API_URL=https://ratemyprof-production.up.railway.app/v1
NEXT_PUBLIC_APP_URL=https://app.ratemyprof.me
NEXT_PUBLIC_LANDING_URL=https://ratemyprof.me
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

### 11. DNS Configuration

**Vercel Custom Domains:**
1. Add domain: `ratemyprof.me` → Point to landing-site project
2. Add domain: `app.ratemyprof.me` → Point to frontend project
3. Add domain: `www.ratemyprof.me` → Redirect to `ratemyprof.me`

**DNS Records (Example):**
```
Type  Name  Value                      TTL
A     @     76.76.21.21               Auto
CNAME app   cname.vercel-dns.com      Auto
CNAME www   cname.vercel-dns.com      Auto
```

### 12. Build & Deploy Commands

**Landing Site:**
```bash
cd landing-site
npm install
npm run build
# Deploy dist/ folder
```

**Frontend App:**
```bash
cd frontend
npm install
npm run build
# Deploy .next/ folder
```

**Backend (Railway auto-deploys on git push):**
```bash
git add .
git commit -m "Production-ready deployment"
git push origin main
```

### 13. Post-Deployment Verification

**Smoke Tests:**
- [ ] Visit https://ratemyprof.me - Landing page loads
- [ ] Check favicon appears in browser tab
- [ ] Verify stats show real numbers (professors, reviews, colleges)
- [ ] Test "Sign In" button opens auth modal
- [ ] Test "Sign Up" button opens auth modal
- [ ] Verify professor cards link to profiles
- [ ] Check API proxy is working (/api/professors)

**Authentication Tests:**
- [ ] Sign up with new account
- [ ] Verify email confirmation
- [ ] Sign in with existing account
- [ ] Test "Remember Me" checkbox
- [ ] Verify session persists on page reload
- [ ] Test sign out and redirect

**Functionality Tests:**
- [ ] Search for professors
- [ ] View professor profile
- [ ] Submit a review (authenticated)
- [ ] Vote on a review (authenticated)
- [ ] Flag a review (authenticated)
- [ ] View college page
- [ ] Submit college review

**Performance Tests:**
- [ ] Check Lighthouse scores (aim for 90+)
- [ ] Verify page load times < 3 seconds
- [ ] Check mobile performance
- [ ] Test with throttled connection

### 14. Monitoring & Error Tracking

**Setup:**
- [ ] Configure error tracking (Sentry recommended)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure Railway alerts
- [ ] Set up Vercel analytics

**Monitor These:**
- [ ] API response times (Railway logs)
- [ ] Frontend errors (Browser console)
- [ ] Authentication failures
- [ ] CORS errors
- [ ] 404s and broken links

### 15. Rollback Plan

**If Critical Issues Occur:**
1. Revert to previous git commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Railway auto-deploys reverted version
3. Rebuild frontend/landing-site from previous commit
4. Check error logs for root cause

**Emergency Contacts:**
- Railway Support: https://railway.app/help
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support

## 📋 Final Checklist Summary

Before clicking "Deploy to Production":

- [x] All hardcoded localhost URLs removed
- [x] Environment variables configured
- [x] CORS includes all production domains
- [x] Authentication flow prevents redirect loops
- [x] Unauthenticated browsing works properly
- [x] Protected actions require login
- [x] Favicon added to landing page
- [x] Dark mode fully implemented
- [ ] Mobile UI tested on real devices
- [ ] All user flows tested end-to-end
- [ ] Cross-browser compatibility verified
- [ ] Performance benchmarks met
- [ ] Error tracking configured
- [ ] Rollback plan documented

## 🎉 Launch Day Tasks

1. **Morning of Launch:**
   - [ ] Run full test suite locally
   - [ ] Verify all environment variables
   - [ ] Check database backups exist
   - [ ] Test rollback procedure

2. **Deploy:**
   - [ ] Deploy backend to Railway
   - [ ] Deploy landing-site to Vercel (ratemyprof.me)
   - [ ] Deploy frontend to Vercel (app.ratemyprof.me)
   - [ ] Verify DNS propagation

3. **Post-Launch:**
   - [ ] Monitor error logs for first hour
   - [ ] Test all critical flows on production
   - [ ] Check analytics are tracking
   - [ ] Announce launch to team/users

4. **First 24 Hours:**
   - [ ] Monitor server performance
   - [ ] Track user sign-ups
   - [ ] Check for error spikes
   - [ ] Respond to user feedback

## 📝 Notes

- **Production URLs:**
  - Landing: `https://ratemyprof.me`
  - App: `https://app.ratemyprof.me`
  - API: `https://ratemyprof-production.up.railway.app`

- **Session Management:**
  - Supabase handles session persistence
  - Sessions stored in httpOnly cookies (secure)
  - SessionStorage used only for flow flags (non-sensitive)

- **No Redirect Loops:**
  - `from_app` flag prevents landing → app loop
  - `from_landing` flag tracks auth flow
  - Banner replaces auto-redirect for authenticated users

- **Security:**
  - All API requests include authentication headers
  - Protected routes require valid session
  - CORS restricts origins
  - Rate limiting enabled on backend
