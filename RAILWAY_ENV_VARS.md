# Railway Environment Variables Configuration

## Required Environment Variables for Railway Deployment

Set these in Railway Dashboard → Your Project → Variables:

### Database Configuration
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Frontend URL (CRITICAL for CORS)
```
FRONTEND_URL=https://ratemyprof.me
```

### Environment
```
ENVIRONMENT=production
```

### JWT Configuration
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
```

### Port (automatically set by Railway)
```
PORT=8000
```

## CORS Origins Currently Configured

The backend accepts requests from:
- `http://localhost:3000` - Development
- `http://localhost:3001` - Development (alt port)
- `http://localhost:3002` - Development (backup)
- `https://ratemyprof-india.vercel.app` - Vercel deployment
- `https://ratemyprof.me` - Production domain
- `http://ratemyprof.me` - Production domain (HTTP)
- `https://www.ratemyprof.me` - Production with www
- `http://www.ratemyprof.me` - Production with www (HTTP)
- `${FRONTEND_URL}` - Configurable via environment variable

## How to Set Environment Variables in Railway

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Select your project: `ratemyprof-production`
3. Click on the backend service
4. Go to "Variables" tab
5. Add each variable listed above
6. Click "Deploy" to apply changes

## Verification

After setting variables and deploying, verify CORS is working:

```bash
curl -I -X OPTIONS https://ratemyprof-production.up.railway.app/api/auth/login \
  -H "Origin: https://ratemyprof.me" \
  -H "Access-Control-Request-Method: POST"
```

Should return:
```
Access-Control-Allow-Origin: https://ratemyprof.me
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

## Common Issues

### CORS Error: "No 'Access-Control-Allow-Origin' header"
**Solution:** Ensure `FRONTEND_URL=https://ratemyprof.me` is set in Railway and service is redeployed.

### 401 Unauthorized
**Solution:** Check `SUPABASE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are correct.

### Database Connection Failed
**Solution:** Verify `SUPABASE_URL` is correct and accessible.
