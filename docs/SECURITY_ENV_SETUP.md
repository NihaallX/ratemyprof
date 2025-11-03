# SECURITY ENVIRONMENT VARIABLES - PRODUCTION DEPLOYMENT

## ⚠️ CRITICAL: NEVER COMMIT THESE VALUES TO GIT!

## Step 1: Generate Admin Password Hash
Run this command locally (ONCE):
```bash
cd backend
python scripts/generate_admin_hash.py "YourVerySecureP@ssw0rd2025!"
```

Copy the generated hash (starts with $bcrypt$...)

## Step 2: Set Environment Variables in Railway/Vercel

### Backend Environment Variables (Required):

```bash
# JWT Secret (generate random 64-character string)
JWT_SECRET_KEY="your-super-secret-jwt-key-at-least-64-characters-long-random-string"

# Admin Credentials
ADMIN_USERNAME="admin@ratemyprof.in"
ADMIN_PASSWORD_HASH="$bcrypt$v=2.1$rounds=12$PASTE_YOUR_HASH_HERE"

# Access Token Configuration
ACCESS_TOKEN_EXPIRE_MINUTES="1440"  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS="7"

# CORS Configuration
ALLOWED_ORIGINS="https://ratemyprof.me,https://www.ratemyprof.me"

# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS="5"
RATE_LIMIT_WINDOW_MINUTES="15"

# Security
DOCS_ENABLED="false"  # Set to "true" only in development
DOCS_ACCESS_TOKEN="your-random-docs-access-token"  # Only if DOCS_ENABLED=true

# Database (from Supabase)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Environment
ENVIRONMENT="production"
```

### Frontend Environment Variables (Optional):

```bash
NEXT_PUBLIC_API_URL="https://ratemyprof-production.up.railway.app"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## Step 3: Verify Security Checklist

- [ ] ADMIN_PASSWORD_HASH is set (not plain text password)
- [ ] JWT_SECRET_KEY is at least 64 characters
- [ ] ALLOWED_ORIGINS only includes your domains
- [ ] DOCS_ENABLED is "false" in production
- [ ] No hardcoded secrets in code
- [ ] .env files are in .gitignore
- [ ] Railway/Vercel environment variables are configured

## Step 4: Test Security

After deployment, test these scenarios:
1. ✅ Admin login works with new password
2. ✅ Rate limiting blocks after 5 failed attempts
3. ✅ CORS blocks requests from unauthorized domains
4. ✅ /docs endpoint is disabled (404 or requires token)
5. ✅ Admin tokens expire after 24 hours
6. ✅ Security headers are present in responses

## Emergency: If Credentials Compromised

1. Generate new JWT_SECRET_KEY immediately
2. Generate new ADMIN_PASSWORD_HASH
3. Update both in Railway/Vercel
4. Restart all services
5. All existing tokens will be invalidated
