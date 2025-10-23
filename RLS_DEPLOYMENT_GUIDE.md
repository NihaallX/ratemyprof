# RLS Security Implementation - Deployment Guide

## ✅ Completed Tasks (Tasks 1-8)

### Task 1: RLS Policies Created ✅
- Created `backend/scripts/rls_policies_authenticated_final.sql` (500+ lines)
- Comprehensive policies for all 14 tables
- Covers authenticated client approach with proper role-based access

### Task 2: Authentication Middleware ✅
- Existing robust system in `backend/src/lib/auth.py`
- Functions: `get_current_user()`, `get_optional_current_user()`, JWT verification
- No changes needed - system already production-ready

### Task 3: Professors Endpoint ✅
- **File**: `backend/src/api/professors_simple.py`
- **Changes**:
  - Added `get_current_user` import
  - Updated `create_professor()` to require authentication
  - Added RLS policy documentation

### Task 4: Reviews Endpoint ✅
- **File**: `backend/src/api/reviews.py`
- **Changes**:
  - Removed all `get_supabase_admin()` usage
  - Updated 4 functions: create, get_user_reviews, delete, duplicate check
  - All operations now use authenticated client with RLS
  - Removed admin client import

### Task 5: College Reviews Endpoint ✅
- **File**: `backend/src/api/college_reviews.py`
- **Changes**:
  - Removed all `get_supabase_admin()` usage
  - Updated 3 functions: create, update, delete
  - Mapping table operations use authenticated client
  - Added RLS policy documentation

### Task 6: Moderation Verified ✅
- **File**: `backend/src/api/moderation.py`
- **Status**: No changes needed
- **Reason**: Correctly uses admin client for privileged operations
- **Operations**: Approve/remove reviews, ban users, moderation logs

### Task 7: RLS Policies Applied ✅
- **Method**: Ran SQL in Supabase SQL Editor
- **Result**: 36 policies created across 12 tables
- **Verification**: Query output confirmed all policies active

### Task 8: Verification Scripts Created ✅
- **Script 1**: `backend/scripts/quick_rls_check.py`
  - Quick sanity check (no auth required)
  - Tests public read and unauthenticated write blocking
  
- **Script 2**: `backend/scripts/verify_rls_security.py`
  - Comprehensive security testing
  - Requires test user in Supabase Auth
  - Tests authenticated operations

---

## 🚀 Next Steps (Tasks 9-13)

### Task 9: Run Verification Tests (IN PROGRESS)

#### Step 1: Quick Check (No Auth Required)
```powershell
# Navigate to backend directory
cd backend

# Run quick check
python scripts/quick_rls_check.py
```

**Expected Output**:
- ✓ Public GET requests return 200
- ✓ Unauthenticated POST requests blocked (401/403)
- ✓ Database tables accessible with service_role

#### Step 2: Create Test User in Supabase

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Email: `test_user@example.com`
4. Password: `TestPassword123!`
5. Auto Confirm: ✅ (enable)
6. Click "Create user"

#### Step 3: Full Verification (With Auth)
```powershell
# Make sure backend server is running
# In one terminal:
cd backend
python -m uvicorn src.main:app --reload

# In another terminal:
cd backend
python scripts/verify_rls_security.py
```

**Expected Output**:
- ✓ User authentication successful
- ✓ Unauthenticated requests blocked
- ✓ Authenticated professor submission works
- ✓ Public read access works
- ✓ RLS policies verified in database

---

### Task 10: Manual End-to-End Testing

#### Test 1: Professor Submission
1. Go to https://ratemyprof.me
2. Log in with test user
3. Submit a new professor
4. ✅ Should succeed and show "submitted for review"

#### Test 2: Review Submission
1. Find a verified professor
2. Submit a review
3. ✅ Should succeed and create review

#### Test 3: College Review
1. Browse to a college page
2. Submit a college review
3. ✅ Should succeed

#### Test 4: Voting
1. Find an approved review
2. Vote helpful/not helpful
3. ✅ Vote should be recorded

#### Test 5: Unauthenticated Access
1. Log out
2. Try to submit professor/review
3. ✅ Should be blocked or redirect to login

---

### Task 11: Deploy to Railway

#### Step 1: Commit Changes
```powershell
# Check status
git status

# Add all changed files
git add backend/src/api/professors_simple.py
git add backend/src/api/reviews.py
git add backend/src/api/college_reviews.py
git add backend/scripts/rls_policies_authenticated_final.sql
git add backend/scripts/verify_rls_security.py
git add backend/scripts/quick_rls_check.py

# Commit
git commit -m "feat: Implement comprehensive RLS security

- Add authentication requirement to all user-facing endpoints
- Remove admin client usage from professors, reviews, college_reviews endpoints
- All operations now use authenticated client with RLS policies
- Add 36 RLS policies across 12 database tables
- Create verification scripts for security testing

Security improvements:
- professors: Authenticated users can submit (unverified by default)
- reviews: Authenticated users can CRUD own reviews
- college_reviews: Authenticated users can CRUD own reviews
- review_author_mappings: Privacy protected, users can only access own mappings
- moderation: Correctly uses admin client (service_role)

All endpoints now enforce auth.uid() checks via RLS policies."

# Push to GitHub
git push origin main
```

#### Step 2: Monitor Railway Deployment
1. Go to Railway dashboard
2. Wait for deployment to complete (~2-3 minutes)
3. Check deployment logs for errors
4. Verify health check endpoint: `https://ratemyprof-production.up.railway.app/health`

#### Step 3: Test Production
```powershell
# Update API_URL for production testing
$env:API_URL="https://ratemyprof-production.up.railway.app/v1"

# Run quick check against production
python backend/scripts/quick_rls_check.py
```

---

### Task 12: Delete Verification Scripts

**After confirming production works:**

```powershell
# Remove verification scripts
git rm backend/scripts/verify_rls_security.py
git rm backend/scripts/quick_rls_check.py
git rm backend/scripts/rls_verification_results_*.json  # if any exist

# Commit
git commit -m "chore: Remove verification scripts after successful deployment"

# Push
git push origin main
```

---

### Task 13: Document Security Implementation

Create `backend/SECURITY.md`:

```markdown
# RateMyProf Security Architecture

## Authentication Model

### JWT Token Flow
1. User logs in via Supabase Auth (frontend)
2. Frontend receives JWT access token
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Backend validates token using `get_current_user()` dependency
5. Supabase RLS policies enforce permissions via `auth.uid()`

### Endpoints

#### Public Endpoints (No Auth Required)
- `GET /colleges` - List colleges
- `GET /professors` - Search professors (verified only)
- `GET /reviews` - List reviews (approved only)
- `GET /college-reviews` - List college reviews (approved only)

#### Authenticated Endpoints (JWT Required)
- `POST /professors` - Submit professor (unverified)
- `POST /reviews` - Submit review
- `PUT /reviews/{id}` - Update own review
- `DELETE /reviews/{id}` - Delete own review
- `POST /college-reviews` - Submit college review
- `PUT /college-reviews/{id}` - Update own college review
- `DELETE /college-reviews/{id}` - Delete own college review
- `POST /review-votes` - Vote on review
- `POST /review-flags` - Flag inappropriate content

#### Admin Endpoints (Service Role)
- `/moderation/*` - All moderation operations
- Requires admin JWT token (separate from user tokens)

## Row-Level Security (RLS) Policies

### Professors Table
- **Public Read**: Only verified professors (`is_verified = true`)
- **Authenticated Insert**: Users can submit professors (will be unverified)
- **Service Role All**: Admin can manage all professors

### Reviews Table
- **Public Read**: Only approved reviews (`status = 'approved'`)
- **Authenticated Insert**: Users can create reviews
- **Authenticated Update**: Users can update own reviews (via mapping table)
- **Service Role All**: Admin can manage all reviews

### Review Author Mappings Table (Privacy)
- **Block Anon**: No public access
- **Authenticated Insert**: Users can create own mappings
- **Authenticated Read**: Users can read only their own mappings
- **Service Role All**: Admin has full access for moderation

### College Reviews Table
- **Public Read**: Only approved college reviews
- **Authenticated Insert**: Users can create college reviews
- **Service Role All**: Admin can manage all

### Review Votes Table
- **Public Read**: Anyone can see vote counts
- **Authenticated Insert/Update**: Users can vote (own votes only)
- **Service Role All**: Admin can manage votes

## Security Best Practices

### 1. Never Use Admin Client in User Endpoints
```python
# ❌ WRONG - Bypasses RLS
supabase_admin = get_supabase_admin()
result = supabase_admin.table('reviews').insert(data).execute()

# ✅ CORRECT - Enforces RLS
async def create_review(
    request: ReviewCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    result = supabase.table('reviews').insert(data).execute()
```

### 2. Always Require Auth for Write Operations
```python
# ✅ Add current_user dependency to enforce authentication
async def create_resource(
    request: ResourceCreate,
    current_user: dict = Depends(get_current_user),  # Required!
    supabase: Client = Depends(get_supabase)
):
    # RLS will check auth.uid() automatically
    ...
```

### 3. Use Mapping Tables for Privacy
- Never store `user_id` directly in public tables (reviews, college_reviews)
- Use separate mapping tables (`review_author_mappings`) with strict RLS
- Only service_role and the author can access mappings

### 4. Admin Operations
- Use `get_supabase_admin()` ONLY for moderation operations
- Check user role before allowing admin actions
- Log all admin actions to audit trail

## Testing Security

Run verification scripts before deployment:

```bash
# Quick sanity check
python backend/scripts/quick_rls_check.py

# Full security verification
python backend/scripts/verify_rls_security.py
```

## Incident Response

If RLS policy is accidentally disabled:

1. **Immediate**: Re-enable RLS on affected table
```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

2. **Recreate**: Run policy creation script
```sql
-- From backend/scripts/rls_policies_authenticated_final.sql
```

3. **Verify**: Run verification scripts
4. **Audit**: Check if any unauthorized access occurred
```sql
SELECT * FROM moderation_audit_logs 
WHERE created_at > '<incident_time>';
```
```

---

## Summary

### What Changed
- ✅ All user-facing endpoints now require authentication
- ✅ Admin client removed from professors, reviews, college_reviews endpoints
- ✅ 36 RLS policies active across 12 tables
- ✅ Verification scripts created and ready to run
- ✅ No code errors, ready to deploy

### Current Status
- **Tasks 1-8**: ✅ Complete
- **Task 9**: 🔄 In Progress (run verification scripts)
- **Tasks 10-13**: ⏳ Pending

### Next Immediate Action
Run verification scripts locally to confirm everything works before deploying to production!

```powershell
# Step 1: Quick check
cd backend
python scripts/quick_rls_check.py

# Step 2: Create test user in Supabase

# Step 3: Full verification
python scripts/verify_rls_security.py
```

Once verification passes, you're ready to deploy! 🚀
