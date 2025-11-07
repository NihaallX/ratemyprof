# Google OAuth Setup Guide

Google OAuth login has been added to both the login and signup pages! 🎉

## What's Been Implemented

✅ **Frontend Changes:**
- Added `signInWithGoogle()` method to `lib/supabase.ts`
- Added Google sign-in button to `/auth/login` page
- Added Google sign-in button to `/auth/signup` page
- Created OAuth callback handler at `/auth/callback`
- Added "Or continue with" divider between email/password and OAuth options
- Used official Google branding colors and icon

✅ **User Flow:**
1. User clicks "Sign in with Google" or "Sign up with Google"
2. Redirects to Google OAuth consent screen
3. User authorizes the app
4. Google redirects back to `/auth/callback`
5. Callback handler processes the OAuth response
6. User is redirected to homepage (authenticated)

## Configuration Required

To enable Google OAuth, you need to configure it in your Supabase dashboard:

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if you haven't already:
   - User Type: External
   - App name: RateMyProf.me
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: RateMyProf.me
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local testing)
     - `https://[your-github-username].github.io` (for production)
   - Authorized redirect URIs:
     - `https://[your-supabase-project-ref].supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list
5. Enable the Google provider
6. Enter your **Client ID** and **Client Secret** from Step 1
7. Click **Save**

### Step 3: Add Redirect URLs to Supabase

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local testing)
   - `https://[your-github-username].github.io/auth/callback` (for production)
3. Click **Save**

### Step 4: Test Locally

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/login`
3. Click "Sign in with Google"
4. You should be redirected to Google's consent screen
5. After authorizing, you should be redirected back and logged in

### Step 5: Deploy to Production

1. Rebuild the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Add Google OAuth login support"
   git push origin main
   ```

3. Wait for GitHub Pages to deploy
4. Test on your production site

## OAuth Configuration Details

The OAuth implementation includes:

- **Access Type**: `offline` - Allows refresh tokens for long-term access
- **Prompt**: `consent` - Always shows the consent screen to ensure users see permissions
- **Redirect URL**: `${window.location.origin}/auth/callback` - Dynamic based on environment
- **Session Persistence**: Enabled via Supabase auto-refresh tokens

## Security Features

✅ OAuth state parameter validation (handled by Supabase)
✅ PKCE flow (handled by Supabase)
✅ Secure session storage
✅ Automatic token refresh
✅ Redirect URL whitelist

## Troubleshooting

**"OAuth failed" error:**
- Check that Google OAuth is enabled in Supabase
- Verify Client ID and Secret are correct
- Ensure redirect URLs match exactly in both Google Cloud Console and Supabase

**Redirect loop:**
- Clear browser cookies
- Check that `/auth/callback` is not protected by authentication

**"Unauthorized" error:**
- Verify your Google Cloud Console project is set to "External" user type
- Add your email to test users if the app is in testing mode

**Local testing not working:**
- Ensure `http://localhost:3000` is in Google's authorized JavaScript origins
- Ensure `http://localhost:3000/auth/callback` is in Supabase's redirect URLs

## Next Steps

After Google OAuth is working:

1. Consider adding other OAuth providers (GitHub, Facebook, etc.)
2. Add user profile enrichment from Google (profile picture, name)
3. Implement email verification bypass for OAuth users (they're already verified by Google)
4. Add analytics to track OAuth vs email/password sign-ups

## Files Modified

- `frontend/src/lib/supabase.ts` - Added `signInWithGoogle()` method
- `frontend/src/pages/auth/login.tsx` - Added Google sign-in button and handler
- `frontend/src/pages/auth/signup.tsx` - Added Google sign-in button and handler
- `frontend/src/pages/auth/callback.tsx` - Created OAuth callback handler

## Support

If you encounter any issues, check:
- Supabase logs in Dashboard > Logs
- Browser console for JavaScript errors
- Network tab for failed OAuth requests
