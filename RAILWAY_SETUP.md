# Railway + Supabase Setup Guide

## Problem
Your Railway backend is running but the Supabase database is empty (0 professors, 0 colleges).

## Solution: Configure Railway Environment Variables

### Step 1: Get your Supabase credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (click "Reveal" to see it)

### Step 2: Set Railway environment variables

1. Go to Railway dashboard: https://railway.app
2. Select your `ratemyprof-production` project
3. Click on **Variables** tab
4. Add these environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

5. Click **Deploy** to restart with new variables

### Step 3: Create database tables in Supabase

Once the environment variables are set, you need to create the database schema.

#### Option A: Run migration script (Recommended)

1. Open Supabase dashboard → **SQL Editor**
2. Run the migration script from `backend/alembic/versions/001_initial_schema.py`

#### Option B: Use SQL directly

Run this in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

If tables don't exist, you need to run the Alembic migration.

### Step 4: Add sample data

After tables are created, you can:
1. Use the frontend's "Add Professor" form
2. Or add data directly in Supabase Table Editor

### Step 5: Verify

Check if data is accessible:
```bash
curl "https://ratemyprof-production.up.railway.app/v1/professors?limit=5"
curl "https://ratemyprof-production.up.railway.app/v1/colleges?limit=5"
```

## Common Issues

### Issue 1: "Missing required Supabase configuration"
**Solution:** Environment variables not set in Railway. Follow Step 2.

### Issue 2: Empty results `{"professors":[],"total":0}`
**Solution:** Tables exist but no data. Add data via frontend or Supabase dashboard.

### Issue 3: 500 Internal Server Error on college reviews
**Solution:** Run `backend/create_college_review_mappings.py` to create the mappings table.

## Quick Check

Run this command to see if Railway has the environment variables:
```bash
curl https://ratemyprof-production.up.railway.app/health
```

If it returns healthy, the backend is running but may need database setup.
