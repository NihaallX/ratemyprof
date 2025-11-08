# Railway Admin Login Fix

## Problem
Admin login returns `401 Unauthorized` because Railway doesn't have the admin password hash configured.

## Solution
Add the following environment variable to Railway:

### Environment Variable to Add:
```
ADMIN_PASSWORD_HASH=$2b$12$FZd1vfjg04VLqXMdQf.Noes21XD9UoeuyYYLm2o1uZRknrXDoEody
```

### Steps to Fix:

1. **Go to Railway Dashboard**
   - Open https://railway.app
   - Navigate to your `ratemyprof-production` project
   - Click on the backend service

2. **Add Environment Variable**
   - Go to "Variables" tab
   - Click "New Variable"
   - Name: `ADMIN_PASSWORD_HASH`
   - Value: `$2b$12$FZd1vfjg04VLqXMdQf.Noes21XD9UoeuyYYLm2o1uZRknrXDoEody`
   - Click "Add"

3. **Redeploy**
   - Railway will automatically redeploy with the new variable
   - Wait for deployment to complete (~2 minutes)

4. **Test Admin Login**
   - Go to `ratemyprof.me/admin/login`
   - Username: `admin`
   - Password: `NihalGaurav#2005!`
   - Should now successfully log in and redirect to dashboard

### Other Required Environment Variables (verify these exist):
```
ADMIN_USERNAME=admin
JWT_SECRET_KEY=<your-secret-key>
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Security Note:
⚠️ **NEVER commit the password hash to GitHub!**
- It's stored only in Railway environment variables
- Backend `.env` file is gitignored
- The hash is generated using bcrypt with 12 rounds

---

## Admin Credentials
- **Username**: `admin`
- **Password**: `NihalGaurav#2005!`
- **Password Hash**: `$2b$12$FZd1vfjg04VLqXMdQf.Noes21XD9UoeuyYYLm2o1uZRknrXDoEody`

---

## After Adding the Variable:
The backend will be able to verify admin login attempts and issue JWT tokens for authenticated admin sessions.
