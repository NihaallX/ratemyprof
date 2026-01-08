# Render Migration Complete

## Changes Made

### ✅ Frontend Updated
- **File**: `frontend/src/config/api.ts`
- **Change**: Updated API base URL from `https://ratemyprof-bay.vercel.app/v1` to `https://ratemyprof.onrender.com/v1`
- **Impact**: Frontend will now make API calls to Render instead of Vercel

### ✅ Vercel Files Removed
1. `backend/api/index.py` - Vercel serverless entry point (deleted)
2. `backend/api/requirements.txt` - Vercel-specific dependencies (deleted)
3. `backend/vercel.json` - Backend Vercel config (deleted)
4. `vercel.json` - Root Vercel config (deleted)

### ✅ Render Configuration Updated
1. **keep-alive-bot.py**: Updated URL from placeholder to `https://ratemyprof.onrender.com/health`
2. **render.yaml**: Updated ALLOWED_ORIGINS to include:
   - `http://localhost:3000` (development)
   - `https://ratemyprof.me` (production frontend)
   - `https://www.ratemyprof.me` (production frontend with www)
   - `https://ratemyprof.onrender.com` (backend itself)

## Important: Update Your Render URL

**⚠️ ACTION REQUIRED**: Replace `ratemyprof.onrender.com` with your **actual** Render deployment URL in:
1. `frontend/src/config/api.ts` (line 9)
2. `keep-alive-bot.py` (line 11)
3. `render.yaml` (line 30)

Your actual Render URL should look like: `https://ratemyprof-xyz123.onrender.com`

## Next Steps

1. **Update URLs**: Replace the placeholder URL with your actual Render app URL
2. **Rebuild Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
3. **Deploy Frontend**: Push to GitHub to trigger GitHub Pages deployment
4. **Update Render Environment**: Make sure your Render service has these environment variables:
   - `ALLOWED_ORIGINS`: Should include `https://ratemyprof.me,https://www.ratemyprof.me`
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `JWT_SECRET`: Your JWT signing secret
   - `DATABASE_URL`: Your Supabase Postgres connection string

5. **Test CORS**: Visit https://ratemyprof.me and check the browser console - API calls should now work

6. **Start Keep-Alive Bot** (optional, prevents Render free tier cold starts):
   ```bash
   python keep-alive-bot.py
   ```

## Verification Checklist

- [ ] Updated all 3 files with actual Render URL
- [ ] Rebuilt frontend (`npm run build`)
- [ ] Pushed changes to GitHub
- [ ] Frontend deploys to GitHub Pages successfully
- [ ] Render service is running
- [ ] Environment variables configured in Render dashboard
- [ ] Visited ratemyprof.me - no CORS errors in console
- [ ] Can view professors list
- [ ] Can view notifications
- [ ] Can see maintenance status
