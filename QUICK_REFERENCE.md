# 🚀 Quick Reference Guide

Quick commands and common tasks for RateMyProf India platform.

## Development Commands

### Start Everything
```bash
# Windows
start-dev.bat

# PowerShell
.\start-dev.ps1
```

### Start Individually
```bash
# Backend only
cd backend
uvicorn src.main:app --reload --port 8000

# Frontend only
cd frontend
npm run dev
```

## Common Tasks

### Add a New API Endpoint
1. Create route in `backend/src/api/your_endpoint.py`
2. Define Pydantic model in `backend/src/models/`
3. Add to router in `backend/src/main.py`
4. Test at `http://localhost:8000/docs`

### Add a New Page
1. Create file in `frontend/src/pages/your-page.tsx`
2. Add to navigation if needed
3. Test at `http://localhost:3000/your-page`

### Update Database Schema
1. Write SQL in `scripts/your_migration.sql`
2. Run in Supabase SQL Editor
3. Update Pydantic models to match

### Deploy Changes
```bash
git add .
git commit -m "feat: Your change description"
git push origin 001-ratemyprof-india-platform

# For production (GitHub Pages will auto-deploy):
git checkout main
git merge 001-ratemyprof-india-platform
git push origin main
```

## Troubleshooting

### Backend won't start
```bash
cd backend
pip install -r requirements.txt
# Check .env file has correct credentials
```

### Frontend won't build
```bash
cd frontend
npm install
# Check .env.local has correct API URL
```

### Database connection error
1. Check Supabase project is active
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
3. Check IP is allowed in Supabase settings

### Review submission fails
- Backend must use `supabase_admin` client (not regular client)
- Check `*_author_mappings` table exists
- Verify RLS policies allow service role access

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
```

### Production (GitHub Secrets)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (your deployed backend URL)

## Testing

```bash
# Backend
cd backend
pytest                        # All tests
pytest tests/test_reviews.py  # Specific file
pytest -v                     # Verbose
pytest --cov=src             # With coverage

# Frontend
cd frontend
npm test                      # All tests
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage
npm run test:e2e             # E2E tests
```

## Database Quick Reference

### Important Tables
- `professors` - Professor information
- `colleges` - College information
- `reviews` - Professor reviews (NO user_id!)
- `college_reviews` - College reviews (NO student_id!)
- `review_author_mappings` - Private: maps reviews to authors
- `college_review_author_mappings` - Private: maps college reviews to authors
- `users` - Extended user information
- `review_flags` - Flagged content
- `user_activities` - Rate limiting

### Key Concepts
- Reviews are anonymous (no direct user reference)
- Authorship stored in separate mapping tables
- Only service role can access mapping tables
- RLS policies enforce privacy

## Git Workflow

```bash
# Daily workflow
git checkout 001-ratemyprof-india-platform
git pull origin 001-ratemyprof-india-platform

# Make changes...

git add .
git commit -m "feat/fix/docs: Description"
git push origin 001-ratemyprof-india-platform

# When ready for production
git checkout main
git merge 001-ratemyprof-india-platform
git push origin main  # Auto-deploys to GitHub Pages
```

## Useful URLs

### Development
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Production
- Website: https://your-domain.com
- GitHub: https://github.com/NihaallX/ratemyprof
- Supabase: https://app.supabase.com

## Emergency Fixes

### Site is down
1. Check GitHub Actions for deployment errors
2. Check backend hosting (Railway/Render)
3. Check DNS configuration
4. Check Supabase status

### Reviews not submitting
1. Check backend logs
2. Verify `supabase_admin` client is used
3. Check mapping tables exist
4. Verify RLS policies

### Authentication broken
1. Check Supabase Auth settings
2. Verify JWT token in localStorage
3. Check API URL in frontend .env.local
4. Verify CORS settings in backend

## Performance Tips

- Use `npm run build` to test production build locally
- Monitor backend response times in `/docs`
- Check Supabase dashboard for query performance
- Use browser DevTools Network tab to debug slow requests

## Security Checklist

- [ ] No sensitive keys in code
- [ ] Environment variables properly set
- [ ] RLS policies enabled on all tables
- [ ] CORS configured correctly
- [ ] Admin endpoints require authentication
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Supabase handles this)
- [ ] XSS prevention (React handles this)

---

For more details, see [README.md](README.md) and [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md)
