# 🎓 RateMyProf India - Complete Project Overview

**Generated:** November 25, 2025  
**Status:** 🟢 Live in Beta Testing  
**Repository:** [github.com/NihaallX/ratemyprof](https://github.com/NihaallX/ratemyprof)

---

## 📊 Executive Summary

**RateMyProf India** is a comprehensive professor and college rating platform designed specifically for Indian universities. The platform enables students to anonymously rate and review professors and colleges across multiple dimensions while maintaining strict privacy and data protection standards.

### Key Highlights
- **🎯 Purpose**: Empower students to make informed educational decisions
- **🏫 Target**: Indian Universities (starting with Vishwakarma University, Pune)
- **🔒 Privacy**: Anonymous reviews with DPDP Act 2023 compliance
- **🤖 AI-Powered**: Advanced content moderation and ranking algorithms
- **📊 Dual Rating System**: Separate ratings for professors and colleges
- **🚀 Live Status**: Currently in beta testing with real users

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
```
Next.js 14 (TypeScript) → Tailwind CSS → Supabase Auth
├── React Components (50+ custom components)
├── Context API for state management
├── Dark mode support
└── Static export for GitHub Pages
```

**Backend:**
```
FastAPI (Python 3.11+) → PostgreSQL (Supabase) → JWT Auth
├── 8 API modules (REST endpoints)
├── Pydantic models for validation
├── Service layer for business logic
└── Bayesian ranking algorithm
```

**Database:**
```
PostgreSQL (Supabase)
├── 15+ tables with Row Level Security (RLS)
├── Anonymous review mapping system
├── User activity tracking
└── Auto-flagging and moderation tables
```

### Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                         │
│         (Next.js Frontend - Port 3000)                  │
└────────────────┬────────────────────────────────────────┘
                 │ HTTPS + JWT
                 ↓
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend                            │
│            (Python API - Port 8000)                     │
├─────────────────────────────────────────────────────────┤
│  API Endpoints:                                         │
│  • /auth         - Authentication                       │
│  • /professors   - Professor CRUD + Search              │
│  • /colleges     - College CRUD + Search                │
│  • /reviews      - Professor reviews                    │
│  • /college-reviews - College reviews                   │
│  • /moderation   - Content moderation                   │
│  • /admin        - Admin operations                     │
│  • /notifications - User notifications                  │
└────────────────┬────────────────────────────────────────┘
                 │ Service Role Key
                 ↓
┌─────────────────────────────────────────────────────────┐
│            Supabase (PostgreSQL)                        │
├─────────────────────────────────────────────────────────┤
│  Core Tables:                                           │
│  • users, professors, colleges                          │
│  • reviews, college_reviews                             │
│  • review_author_mappings (privacy)                     │
│  • college_review_author_mappings (privacy)             │
│  • auto_flagging_rules, flagged_reviews                │
│  • user_activities, user_notifications                 │
│  • banned_users, user_warnings                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
ratemyprof/
│
├── 📱 frontend/                    # Next.js 14 Application
│   ├── src/
│   │   ├── components/            # 50+ React Components
│   │   │   ├── CollegeReviews.tsx (with dark mode ✅)
│   │   │   ├── CollegeReviewForm.tsx
│   │   │   ├── ReviewSubmissionForm.tsx
│   │   │   ├── UserDropdown.tsx
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── CompareColleges.tsx
│   │   │   ├── CompareProfessors.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── index.tsx          # Home page with search
│   │   │   ├── landing/           # Marketing landing page
│   │   │   ├── auth/              # Login, Signup, Verify
│   │   │   ├── professors/[id].tsx # Professor detail
│   │   │   ├── colleges/[id].tsx   # College detail
│   │   │   ├── admin.tsx          # Admin dashboard
│   │   │   ├── profile.tsx        # User profile
│   │   │   ├── my-reviews.tsx     # User's reviews
│   │   │   ├── privacy.tsx        # Legal pages
│   │   │   ├── terms.tsx
│   │   │   ├── guidelines.tsx
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── NotificationContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   └── api.ts             # API client
│   │   └── lib/
│   │       └── supabase.ts        # Supabase client
│   ├── public/                    # Static assets
│   ├── next.config.js             # Static export config
│   └── tailwind.config.js         # Dark mode support
│
├── 🐍 backend/                     # FastAPI Application
│   ├── src/
│   │   ├── api/                   # API Endpoints (8 modules)
│   │   │   ├── auth.py            # JWT authentication
│   │   │   ├── professors.py      # Professor operations
│   │   │   ├── professors_simple.py # ✨ Bayesian ranking
│   │   │   ├── colleges.py        # College operations
│   │   │   ├── reviews.py         # Professor reviews
│   │   │   ├── college_reviews.py # College reviews
│   │   │   ├── moderation.py      # Content moderation
│   │   │   ├── college_review_moderation.py
│   │   │   └── user_limits.py     # Rate limiting
│   │   ├── models/                # Pydantic Models (5 modules)
│   │   ├── services/              # Business Logic (3 modules)
│   │   │   ├── content_filter.py  # AI filtering
│   │   │   ├── auto_flagging.py
│   │   │   └── user_communication.py
│   │   ├── lib/                   # Utilities (9 modules)
│   │   │   ├── database.py
│   │   │   ├── auth.py
│   │   │   ├── bayesian_ranking.py ✨ NEW
│   │   │   ├── cache.py
│   │   │   ├── rate_limiting.py
│   │   │   ├── notification_events.py
│   │   │   └── ...
│   │   └── main.py                # FastAPI app
│   ├── tests/
│   │   ├── test_bayesian_ranking.py ✨ NEW (6 tests)
│   │   └── ...
│   └── requirements.txt
│
├── 📜 scripts/                     # SQL Setup Scripts (15+)
│   ├── create_users_table.sql
│   ├── create_missing_tables.sql
│   ├── create_auto_flagging_tables.sql
│   ├── create_user_activities_table.sql
│   ├── create_college_review_author_mappings.sql
│   └── ...
│
├── 📝 docs/                        # Documentation (20+ files)
│   ├── SYSTEM_DOCUMENTATION.md
│   ├── NEW_FEATURES_DOCUMENTATION.md
│   ├── ADMIN_PANEL_FIXES.md
│   ├── DARK_MODE_DIAGNOSTIC.md
│   ├── BAYESIAN_RANKING_README.md ✨ NEW
│   └── ...
│
└── 🔧 Configuration
    ├── railway.toml               # Railway deployment
    ├── .github/workflows/         # CI/CD pipelines
    ├── start-all.bat              # Windows launcher
    ├── start-all.ps1              # PowerShell launcher
    └── README.md                  # Main documentation
```

---

## ✨ Features Breakdown

### 1. 🎓 Professor Rating System (100% Complete)

**Features:**
- ✅ Multi-dimensional ratings (Overall, Clarity, Helpfulness, Difficulty)
- ✅ Anonymous review submission
- ✅ Course-specific feedback
- ✅ "Would take again" metric
- ✅ Review voting (helpful/not helpful)
- ✅ Review flagging system
- ✅ Advanced search and filters
- ✅ Professor comparison tool

**Key Files:**
- Frontend: `frontend/src/pages/professors/[id].tsx`
- Backend: `backend/src/api/reviews.py`
- Component: `frontend/src/components/ReviewSubmissionForm.tsx`

### 2. 🏛️ College Rating System (100% Complete)

**Features:**
- ✅ 7-dimension rating system:
  - Overall Quality
  - Teaching
  - Facilities
  - Opportunities
  - Clubs & Activities
  - Internet Connectivity
  - Food Quality
- ✅ Anonymous reviews with mapping
- ✅ Course and graduation year context
- ✅ Review voting system
- ✅ College comparison tool
- ✅ Dark mode support ✨ NEW

**Key Files:**
- Frontend: `frontend/src/components/CollegeReviews.tsx` (with dark mode)
- Backend: `backend/src/api/college_reviews.py`
- Component: `frontend/src/components/CollegeReviewForm.tsx`

### 3. 🎯 Bayesian Ranking System (100% Complete) ✨ NEW

**Features:**
- ✅ Statistical ranking algorithm
- ✅ Balances quality vs quantity
- ✅ Prevents gaming (1 review can't dominate)
- ✅ Formula: `score = (C × global_mean + reviews × rating) / (C + reviews)`
- ✅ Optional recency weighting
- ✅ Configurable confidence parameter
- ✅ Explainability for each ranking
- ✅ Comprehensive test suite

**Implementation:**
- Algorithm: `backend/src/lib/bayesian_ranking.py` (240 lines)
- API: `backend/src/api/professors_simple.py` (GET /top-rated)
- Tests: `backend/tests/test_bayesian_ranking.py` (6 tests, all passing)
- Docs: `backend/src/lib/BAYESIAN_RANKING_README.md`

**API Parameters:**
```
GET /v1/professors/top-rated?limit=6&min_reviews=1&confidence=10&enable_recency=false
```

### 4. 🔐 Authentication System (100% Complete)

**Features:**
- ✅ Email/password signup
- ✅ Email verification
- ✅ JWT token-based auth
- ✅ Password reset flow
- ✅ Secure session management
- ✅ Role-based access control

**Key Files:**
- Frontend: `frontend/src/pages/auth/` (login, signup, verify, reset)
- Backend: `backend/src/api/auth.py`
- Context: `frontend/src/contexts/AuthContext.tsx`

### 5. 🛡️ Content Moderation (100% Complete)

**Features:**
- ✅ AI-powered profanity detection (better-profanity)
- ✅ Sentiment analysis (TextBlob)
- ✅ Spam detection (ML classifier)
- ✅ Auto-flagging rules engine
- ✅ Manual review system
- ✅ Bulk approve/reject operations
- ✅ Review appeal process

**Key Files:**
- Backend: `backend/src/services/content_filter.py`
- Backend: `backend/src/api/moderation.py`
- Frontend: `frontend/src/pages/admin.tsx`

### 6. 👥 Admin Panel (100% Complete)

**Features:**
- ✅ Dashboard with statistics
- ✅ Review moderation queue
- ✅ User management
- ✅ Professor management
- ✅ College management
- ✅ Bulk operations
- ✅ User communication (warnings, bans)
- ✅ Activity logs
- ✅ Analytics and reports

**Key Files:**
- Frontend: `frontend/src/pages/admin.tsx` (2500+ lines)
- Backend: Multiple API modules

### 7. 🌙 Dark Mode Support (100% Complete) ✨ NEW

**Features:**
- ✅ Complete dark mode theming
- ✅ Smooth transitions
- ✅ Proper contrast ratios
- ✅ College reviews section fully styled
- ✅ Persistent theme preference

**Implementation:**
- Uses Tailwind's `dark:` classes
- Theme stored in localStorage
- ThemeProvider context

### 8. 📊 Analytics & Tracking (100% Complete)

**Features:**
- ✅ User activity tracking
- ✅ Review submission tracking
- ✅ Platform statistics
- ✅ Admin analytics dashboard
- ✅ Rate limiting and abuse prevention

---

## 🗄️ Database Schema

### Core Tables (15+)

1. **users** - User accounts
2. **professors** - Professor profiles
3. **colleges** - College profiles
4. **reviews** - Professor reviews (NO user_id = anonymous)
5. **college_reviews** - College reviews (NO user_id = anonymous)
6. **review_author_mappings** - Maps reviews to authors (RLS protected)
7. **college_review_author_mappings** - Maps college reviews to authors
8. **auto_flagging_rules** - Moderation rules
9. **flagged_reviews** - Auto-flagged content
10. **user_activities** - Activity logs
11. **user_notifications** - Notification system
12. **banned_users** - Ban management
13. **user_warnings** - Warning system
14. **review_votes** - Helpful/not helpful votes
15. **college_review_votes** - College review votes

### Privacy Architecture

**Anonymous Reviews with Secure Mapping:**
```
┌─────────────────┐        ┌────────────────────────┐
│   reviews       │        │ review_author_mappings │
│  (PUBLIC)       │        │     (RLS PROTECTED)    │
├─────────────────┤        ├────────────────────────┤
│ id (UUID)       │◄───────│ review_id              │
│ professor_id    │        │ author_id              │
│ overall_rating  │        │ created_at             │
│ review_text     │        └────────────────────────┘
│ created_at      │                   ↑
│ (NO user_id!)   │                   │ Only service role can read
└─────────────────┘                   │ Users see their own via API
```

**Benefits:**
- ✅ Reviews are truly anonymous (no user_id)
- ✅ Platform can still track authorship for moderation
- ✅ Users can manage their own reviews via API
- ✅ Complies with DPDP Act 2023

---

## 🚀 Deployment Status

### Current State

| Component | Status | Platform | URL |
|-----------|--------|----------|-----|
| Frontend | ✅ Live | GitHub Pages | Custom Domain |
| Backend | ✅ Live | Railway | Custom Domain |
| Database | ✅ Live | Supabase | Production |
| Custom Domain | ✅ Active | Configured | Live |

### Deployment Status

**Frontend (GitHub Pages):**
- ✅ Static export configured
- ✅ GitHub Actions workflow deployed
- ✅ Build successful
- ✅ Secrets configured
- ✅ Custom domain active
- ✅ SSL/HTTPS enabled

**Backend (Railway):**
- ✅ Deployed and running
- ✅ Railway.toml configuration
- ✅ Environment variables set
- ✅ Database connection configured
- ✅ Custom domain/subdomain active
- ✅ SSL/HTTPS enabled

**Beta Testing Phase:**
- ✅ Platform accessible via custom domain
- ✅ End-to-end functionality tested
- ✅ Real users submitting reviews
- ✅ Monitoring and logging active
- 🔄 Collecting user feedback
- 🔄 Performance optimization ongoing

---

## 📈 Project Statistics

### Code Metrics

**Frontend:**
- **Files**: 50+ TypeScript/TSX files
- **Components**: 50+ React components
- **Pages**: 25+ Next.js pages
- **Lines of Code**: ~15,000 lines
- **Dependencies**: 50+ npm packages

**Backend:**
- **Files**: 30+ Python modules
- **API Endpoints**: 40+ REST endpoints
- **Lines of Code**: ~8,000 lines
- **Dependencies**: 30+ Python packages
- **Tests**: 10+ test files (growing)

**Database:**
- **Tables**: 15+ tables
- **SQL Scripts**: 15+ setup scripts
- **Policies**: 20+ RLS policies

### Development Timeline

```
Phase 1: Core Platform (Oct 2024)
  ├── Database schema design
  ├── Backend API development
  ├── Frontend UI/UX
  └── Professor & College rating systems

Phase 2: Moderation & Safety (Nov 2024)
  ├── AI content filtering
  ├── Auto-flagging system
  ├── Admin panel development
  └── User management

Phase 3: Advanced Features (Nov 2025) ✨
  ├── Bayesian ranking algorithm
  ├── Dark mode implementation
  ├── Performance optimization
  └── Production readiness

Phase 4: Deployment (In Progress)
  ├── Frontend build & testing ✅
  ├── Backend deployment ⚠️
  ├── Custom domain setup ⚠️
  └── SSL/HTTPS configuration ⚠️
```

---

## 🎯 Current Priorities

### High Priority (Beta Testing Phase)
1. **User Feedback Collection** - Gather insights from beta testers
2. **Bug Fixes** - Address issues reported by users
3. **Performance Optimization** - Monitor and improve response times
4. **Security Monitoring** - Track authentication and data handling

### Medium Priority (Pre-Launch)
1. **Analytics Integration** - Track user behavior and engagement
2. **Email Notifications** - Review responses, moderation alerts
3. **SEO Optimization** - Improve search engine visibility
4. **Marketing Materials** - Prepare for public launch

### Low Priority (Post-Launch)
1. Mobile app development (React Native)
2. Advanced search (Elasticsearch)
3. Multi-language support (Hindi, etc.)
4. Premium features and monetization

---

## 🔧 Development Workflow

### Local Development

```bash
# Start both servers
.\start-all.ps1    # PowerShell
start-all.bat      # Windows CMD

# Or separately:
# Terminal 1 - Backend
cd backend
uvicorn src.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/v1
- API Docs: http://localhost:8000/docs

### Testing

```bash
# Backend tests
cd backend
pytest                          # All tests
pytest tests/test_bayesian_ranking.py  # Specific test
pytest --cov=src               # With coverage

# Frontend tests
cd frontend
npm test                        # Unit tests
npm run test:e2e               # E2E tests
```

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature
# ... create PR on GitHub ...

# Main branch (protected)
git checkout main
git pull origin main
```

---

## 📊 Performance Metrics

### Current Performance

**Backend API:**
- Response Time: ~50-200ms (average)
- Throughput: ~100 req/sec (local)
- Caching: 5-minute TTL for top-rated endpoints
- Rate Limiting: 100 req/15min per IP

**Frontend:**
- Build Time: ~30 seconds
- Bundle Size: ~800KB (gzipped)
- Lighthouse Score: 90+ (Performance)
- First Contentful Paint: <2s

**Database:**
- Query Time: <50ms (most queries)
- Connection Pooling: Enabled
- Row Level Security: Active
- Backup: Automatic daily

---

## 🛡️ Security Features

### Implemented Security Measures

1. **Authentication:**
   - JWT token-based auth
   - Secure password hashing (bcrypt)
   - Email verification required
   - Session management

2. **Authorization:**
   - Role-based access control (RBAC)
   - Row Level Security (RLS) in database
   - Service role for admin operations
   - User-specific data access

3. **Data Protection:**
   - Anonymous review system
   - Encrypted data at rest (Supabase)
   - HTTPS/TLS in production
   - CORS configured properly

4. **Content Security:**
   - AI-powered profanity filter
   - Spam detection
   - SQL injection prevention (Pydantic validation)
   - XSS protection (React sanitization)

5. **Rate Limiting:**
   - IP-based rate limiting
   - User-based rate limiting
   - API endpoint throttling
   - Abuse prevention

### Compliance

- ✅ **DPDP Act 2023** (Digital Personal Data Protection Act)
- ✅ **IT Act 2000** (Information Technology Act)
- ✅ **Privacy by Design** principles
- ✅ **Right to be Forgotten** (user data deletion)

---

## 📞 Support & Resources

### Documentation
- [README.md](README.md) - Main documentation
- [SYSTEM_DOCUMENTATION.md](docs/SYSTEM_DOCUMENTATION.md) - Architecture
- [BAYESIAN_RANKING_README.md](backend/src/lib/BAYESIAN_RANKING_README.md) - Ranking algorithm
- [GITHUB_PAGES_SETUP.md](docs/GITHUB_PAGES_SETUP.md) - Deployment guide

### Community
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Q&A and community support
- Pull Requests: Contributions welcome

### Contact
- **Repository**: [github.com/NihaallX/ratemyprof](https://github.com/NihaallX/ratemyprof)
- **Lead Developer**: NihaallX
- **Current Branch**: main

---

## 🎉 Recent Achievements

### November 2025
- ✅ **Bayesian Ranking System** - Advanced algorithm for fair professor rankings
- ✅ **Dark Mode Support** - Complete theming across college reviews
- ✅ **API Optimization** - Fixed validation errors and improved performance
- ✅ **Test Coverage** - Added comprehensive test suite for ranking algorithm
- ✅ **Documentation** - Created detailed technical documentation

### October 2025
- ✅ **GitHub Pages Setup** - Configured static export and deployment
- ✅ **Authentication Flow** - Complete signup/login/verify system
- ✅ **Legal Compliance** - Privacy policy, terms, and DPDP compliance
- ✅ **Admin Panel** - Full-featured moderation dashboard
- ✅ **Content Filtering** - AI-powered moderation system

---

## 🚀 Next Steps

### Immediate (Current - Beta Testing)
1. ✅ Deploy backend to Railway
2. ✅ Configure production environment variables
3. ✅ Deploy frontend to GitHub Pages
4. ✅ Custom domain configuration
5. ✅ SSL/HTTPS setup
6. 🔄 Collect and analyze user feedback
7. 🔄 Fix bugs and optimize performance

### Short-term (Next 2-4 Weeks)
1. Analytics integration (Google Analytics, Mixpanel)
2. Email notification system
3. Advanced monitoring and alerting
4. Performance optimization based on beta metrics
5. Security hardening based on testing

### Medium-term (Next 1-2 Months)
1. Public launch preparation
2. Marketing campaign
3. SEO optimization and content strategy
4. Onboarding more universities
5. Community building

### Long-term (Next Quarter)
1. Mobile app development (React Native)
2. Advanced search features (Elasticsearch)
3. Multi-language support (Hindi, Marathi, etc.)
4. Premium features and monetization
5. API for third-party integrations

---

## 📋 Conclusion

**RateMyProf India** is a mature, well-architected platform that's **currently live in beta testing**. The recent additions of the Bayesian ranking system and dark mode support represent significant improvements in both user experience and technical sophistication.

**Key Strengths:**
- ✅ Solid technical foundation (Next.js + FastAPI + PostgreSQL)
- ✅ Comprehensive feature set (ratings, reviews, moderation)
- ✅ Privacy-first architecture (anonymous reviews)
- ✅ AI-powered moderation (spam, profanity, sentiment)
- ✅ Advanced ranking algorithm (Bayesian)
- ✅ Complete documentation
- ✅ **Live and accessible via custom domain**
- ✅ **Deployed on Railway (backend) + GitHub Pages (frontend)**
- ✅ **SSL/HTTPS enabled**
- ✅ **Real users testing the platform**

**Beta Testing Achievements:**
- ✅ Backend deployment complete (Railway)
- ✅ Frontend deployment complete (GitHub Pages)
- ✅ Custom domain configured and active
- ✅ Production environment tested
- ✅ Beta users onboarded and testing

**Remaining Work (Pre-Public Launch):**
- 🔄 Collect and address user feedback
- 🔄 Performance optimization based on real usage
- 🔄 Bug fixes from beta testing
- ⏳ Analytics integration
- ⏳ Marketing materials preparation
- ⏳ SEO optimization

**Estimated Time to Public Launch:** 2-4 weeks (depending on beta feedback)

---

**Generated**: November 25, 2025  
**Version**: 1.0  
**Status**: Live in Beta Testing  
**Next Update**: After public launch

