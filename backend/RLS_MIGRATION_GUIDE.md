# RLS Migration Guide

## What Changed

We've transitioned from bypassing RLS to properly enforcing Row-Level Security policies across all tables. This ensures:

1. **Security**: Only authorized operations succeed
2. **Transparency**: Clear policies define who can do what
3. **Auditability**: All operations are logged and trackable

## Tables with RLS Enabled

- `professors` - Public read (verified only), service_role insert/update/delete
- `reviews` - Public read (approved only), service_role full access
- `review_mappings` - Service_role full access, users see own mappings
- `review_votes` - Public read, service_role manages
- `college_reviews` - Public read (approved only), service_role full access  
- `college_review_mappings` - Service_role full access, users see own
- `colleges` - Public read, service_role manages
- `user_activities` - Users see own, service_role manages

## How to Apply RLS Policies

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `xgnewppqxqkyeabtmenf`
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**

### Step 2: Run the RLS Policy Script

1. Open `backend/scripts/enable_rls_policies.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** button

### Step 3: Verify Policies

The script includes verification queries at the end. Check that:

- All tables show `rowsecurity = true`
- Each table has appropriate policies listed

## Backend Code Changes

### Files Modified

1. **`backend/src/api/professors_simple.py`**
   - `create_professor()` now uses `supabase_admin` for inserts
   - RLS Policy: "Service role can insert professors"
   
2. **`backend/src/api/reviews.py`** (already using admin client)
   - Review submissions use service_role
   - Voting operations use service_role
   
3. **`backend/src/api/college_reviews.py`** (already using admin client)
   - College review operations use service_role

### Why Service Role?

The backend **needs** service_role (admin client) for write operations because:

1. **Anonymous Reviews**: Users don't authenticate, so backend acts on their behalf
2. **Moderation**: System needs to update status, flags, etc.
3. **Integrity**: Backend enforces business logic (spam detection, rate limits, etc.)

### RLS Still Enforces Security

Even with service_role, security is maintained because:

1. **API Layer**: FastAPI endpoints validate requests
2. **Business Logic**: Content filtering, duplicate detection, etc.
3. **RLS Policies**: Define what service_role can do
4. **Audit Trail**: All operations are logged

## Testing After Migration

### 1. Professor Submission
```bash
curl -X POST https://ratemyprof-production.up.railway.app/v1/professors/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Professor",
    "department": "Computer Science",
    "college_id": "VU-PUNE-001",
    "subjects": ["Data Structures"],
    "message": "Testing professor submission"
  }'
```

**Expected**: Success with `professor_id` returned

### 2. Review Submission
```bash
curl -X POST https://ratemyprof-production.up.railway.app/v1/reviews/ \
  -H "Content-Type: application/json" \
  -d '{
    "professor_id": "PROF-ID-HERE",
    "rating": 4.5,
    "difficulty": 3.0,
    "would_take_again": true,
    "attendance_mandatory": false,
    "review_text": "Great professor!",
    "course_code": "CS101"
  }'
```

**Expected**: Success with review ID returned

### 3. Verify RLS Enforcement

Try accessing tables directly with anon key - should be blocked:
```javascript
// Frontend code using anon key
const { data, error } = await supabase
  .from('professors')
  .insert({ name: 'Hacker' }) // Should fail!
```

**Expected**: RLS policy violation error

## Rollback Plan

If issues arise, temporarily disable RLS on a table:

```sql
ALTER TABLE professors DISABLE ROW LEVEL SECURITY;
```

Then investigate and fix policies before re-enabling.

## Next Steps

1. ✅ Apply SQL script to Supabase
2. ✅ Deploy backend changes to Railway
3. ✅ Test professor submission
4. ✅ Test review submission
5. ✅ Monitor Railway logs for RLS errors
6. ✅ Verify frontend operations work correctly
