# 🔐 SECURITY DEPLOYMENT GUIDE

## Critical Security Improvements Applied

### ✅ 1. Double Hashing for Admin Credentials
- **Implementation**: bcrypt + PBKDF2 (12 rounds bcrypt, 100,000 rounds PBKDF2)
- **Location**: `backend/src/config/security.py`
- **Status**: ✅ Implemented
- **Action Required**: Generate hash using `python scripts/generate_admin_hash.py`

### ✅ 2. Environment-Based Secrets Management
- **Removed**: All hardcoded passwords and secret keys from code
- **Location**: Now in environment variables only
- **Files Updated**:
  - `backend/src/api/moderation.py`
  - `backend/src/lib/auth.py`
  - `backend/src/main.py`
- **Status**: ✅ Implemented
- **Action Required**: Set environment variables (see SECURITY_ENV_SETUP.md)

### ✅ 3. CORS Restriction
- **Before**: `allow_origins=["*"]` (CRITICAL VULNERABILITY)
- **After**: `allow_origins=["https://ratemyprof.me", ...]` (from env var)
- **Location**: `backend/src/main.py`
- **Status**: ✅ Implemented

### ✅ 4. Security Headers
- **Added**:
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `X-XSS-Protection: 1; mode=block` (XSS protection)
  - `Strict-Transport-Security` (forces HTTPS)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (restricts dangerous features)
- **Location**: `backend/src/main.py` + `backend/src/config/security.py`
- **Status**: ✅ Implemented

### ✅ 5. Rate Limiting on Admin Login
- **Protection**: 5 attempts per 15 minutes per IP
- **Location**: `backend/src/api/moderation.py`
- **Status**: ✅ Implemented
- **Returns**: 429 Too Many Requests after limit exceeded

### ✅ 6. JWT Token Expiration
- **Before**: Tokens never expired (CRITICAL VULNERABILITY)
- **After**: 24 hours default, configurable via env
- **Location**: `backend/src/api/moderation.py`
- **Status**: ✅ Implemented

### ✅ 7. Separate Admin Routes
- **Structure**:
  - `/admin` → Redirects to `/admin/login`
  - `/admin/login` → Admin authentication page
  - `/admin/dashboard` → Protected dashboard (requires auth)
- **Files**:
  - `frontend/src/pages/admin/index.tsx` (gateway)
  - `frontend/src/pages/admin/login.tsx` (login)
- **Status**: ✅ Implemented

### ✅ 8. /docs Endpoint Protection
- **Before**: Publicly accessible at `/docs`
- **After**: Disabled in production (DOCS_ENABLED=false)
- **Location**: `backend/src/main.py`
- **Status**: ✅ Implemented

### ✅ 9. Vercel Deployment Configuration
- **File**: `vercel.json`
- **Features**:
  - Separate frontend/backend builds
  - API routing configured
  - India region (bom1) for low latency
- **Status**: ✅ Created

---

## 🚀 DEPLOYMENT STEPS

### Prerequisites
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Verify passlib and bcrypt are installed
pip list | grep -E "passlib|bcrypt"
```

### Step 1: Generate Admin Password Hash (LOCAL ONLY)
```bash
cd backend
python scripts/generate_admin_hash.py "YourVerySecureP@ssw0rd2025!"

# Copy the output hash (starts with $bcrypt$...)
# Example: $bcrypt$2b$12$abcdef...xyz
```

### Step 2: Set Environment Variables

#### Railway Deployment:
1. Go to: https://railway.app/project/your-project/variables
2. Add these variables:

```bash
JWT_SECRET_KEY="generate-using-openssl-rand-hex-32"
ADMIN_USERNAME="admin@ratemyprof.in"
ADMIN_PASSWORD_HASH="$bcrypt$paste-generated-hash-here"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"
ALLOWED_ORIGINS="https://ratemyprof.me,https://www.ratemyprof.me"
RATE_LIMIT_LOGIN_ATTEMPTS="5"
RATE_LIMIT_WINDOW_MINUTES="15"
DOCS_ENABLED="false"
ENVIRONMENT="production"
```

#### Vercel Deployment:
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add the same variables as above
3. Select "Production" environment

### Step 3: Verify .gitignore
Ensure these are in `.gitignore`:
```
backend/.env
backend/**/.env
.env
.env.local
*.pem
*.key
```

### Step 4: Deploy
```bash
# Commit security changes
git add .
git commit -m "Security: Implement double hashing, env vars, rate limiting, CORS restriction"
git push origin main

# Railway will auto-deploy
# For Vercel: Connect repo and deploy
```

### Step 5: Post-Deployment Verification

#### Test 1: Admin Login with New Password
```bash
curl -X POST https://ratemyprof-production.up.railway.app/v1/admin/moderation/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@ratemyprof.in","password":"YourPassword"}'
```
Expected: 200 OK with JWT token

#### Test 2: Rate Limiting
```bash
# Try 6 times with wrong password
for i in {1..6}; do
  curl -X POST https://your-api.com/v1/admin/moderation/admin/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin@ratemyprof.in","password":"wrong"}'
done
```
Expected: 429 Too Many Requests on 6th attempt

#### Test 3: CORS Protection
```bash
curl -X GET https://your-api.com/v1/professors \
  -H "Origin: https://malicious-site.com" \
  -v
```
Expected: No `Access-Control-Allow-Origin` header

#### Test 4: Security Headers
```bash
curl -I https://your-api.com/health
```
Expected headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`

#### Test 5: /docs Disabled
```bash
curl https://your-api.com/docs
```
Expected: 404 Not Found

---

## 🔒 SECURITY BEST PRACTICES CHECKLIST

- [x] No hardcoded credentials in source code
- [x] All secrets in environment variables
- [x] Double hashing (bcrypt + PBKDF2) for admin password
- [x] JWT tokens expire after 24 hours
- [x] Rate limiting on login (5 attempts / 15 min)
- [x] CORS restricted to specific domains
- [x] Security headers on all responses
- [x] /docs endpoint disabled in production
- [x] Admin routes separated from public routes
- [x] Supabase handles user password hashing (automatic)
- [x] .env files in .gitignore
- [x] HTTPS enforced (Strict-Transport-Security header)

---

## ⚠️ BREAKING CHANGES

### 1. Admin Login Credentials
- **Old**: `admin@gmail.com` / `gauravnihal123`
- **New**: `admin@ratemyprof.in` / (your new password)
- **Action**: Update admin credentials immediately

### 2. Admin Dashboard URL
- **Old**: `ratemyprof.me/admin-login` → dashboard
- **New**: `ratemyprof.me/admin` → redirects to `/admin/login` → `/admin/dashboard`
- **Action**: Update bookmarks

### 3. Environment Variables Required
- **Before**: App worked without environment variables
- **After**: App WILL CRASH without `JWT_SECRET_KEY` and `ADMIN_PASSWORD_HASH`
- **Action**: Set environment variables before deployment

---

## 🆘 EMERGENCY PROCEDURES

### If Admin Credentials Are Compromised:
1. **Immediate**: Generate new password hash
   ```bash
   python scripts/generate_admin_hash.py "NewEmergencyP@ssw0rd2025!"
   ```
2. **Immediate**: Update `ADMIN_PASSWORD_HASH` in Railway/Vercel
3. **Immediate**: Generate new `JWT_SECRET_KEY`
   ```bash
   openssl rand -hex 32
   ```
4. **Immediate**: Update environment variables
5. **Immediate**: Restart all services
6. All existing admin tokens will be invalidated

### If JWT Secret Is Compromised:
1. Generate new secret: `openssl rand -hex 32`
2. Update `JWT_SECRET_KEY` in Railway/Vercel
3. Restart services
4. All existing tokens (admin + user) will be invalidated
5. Users need to re-login

---

## 📊 SECURITY METRICS

Monitor these metrics after deployment:
- Failed admin login attempts per hour
- Rate limit triggers per day
- CORS rejection count
- Token expiration events
- /docs access attempts (should be 0)

---

## 🔍 PENETRATION TESTING

After deployment, test these attack vectors:
- [ ] Brute force admin login (should block after 5 attempts)
- [ ] SQL injection on all input fields
- [ ] XSS injection in review text
- [ ] CORS bypass attempts
- [ ] JWT token manipulation
- [ ] /docs endpoint access
- [ ] Admin route access without auth
- [ ] Expired token usage

---

## 📝 FUTURE ENHANCEMENTS

Consider implementing:
1. **Redis for rate limiting** (currently in-memory)
2. **2FA for admin accounts**
3. **IP whitelisting for admin panel**
4. **Audit logging for all admin actions**
5. **Automated security scanning (Snyk, Dependabot)**
6. **Content Security Policy (CSP) headers**
7. **API key rotation mechanism**

---

## 📞 SUPPORT

If you encounter issues:
1. Check environment variables are set correctly
2. Verify password hash was generated properly
3. Check Railway/Vercel logs for errors
4. Test locally with .env file first
5. Contact: security@ratemyprof.in (hypothetical)
