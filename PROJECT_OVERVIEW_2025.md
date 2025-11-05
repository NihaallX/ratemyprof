# 🎓 RateMyProf India - Complete Project Overview (October 2025)

> **Live Platform:** https://ratemyprof.me  
> **Backend API:** https://ratemyprof-api.railway.app  
> **Repository:** https://github.com/NihaallX/ratemyprof  
> **Status:** 🟢 Production (90% Complete)

---

## 📋 Table of Contents

1. [What Is This Project?](#what-is-this-project)
2. [How It Works](#how-it-works)
3. [Tech Stack & Architecture](#tech-stack--architecture)
4. [Project Structure](#project-structure)
5. [Key Features](#key-features)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Recent Fixes & Updates](#recent-fixes--updates)
9. [Deployment Setup](#deployment-setup)
10. [How to Run Locally](#how-to-run-locally)
11. [Current Issues & Todo](#current-issues--todo)

---

## 🎯 What Is This Project?

**RateMyProf India** is a comprehensive rating platform for Indian universities where students can:

1. **Rate Professors** - Submit anonymous reviews on teaching quality, clarity, helpfulness
2. **Rate Colleges** - Review facilities, teaching, placements, campus life
3. **Browse Ratings** - Make informed decisions about education
4. **Stay Anonymous** - Reviews are completely anonymous (authorship hidden from public)

### Target Audience
- **Primary:** Students at Indian universities (starting with Vishwakarma University, Pune)
- **Secondary:** Prospective students researching colleges/professors
- **Tertiary:** Colleges seeking authentic feedback

### Key Differentiator
**Privacy-First Architecture:** Unlike other platforms, we separate review content from authorship using mapping tables, ensuring true anonymity while maintaining accountability.

---

## 🔄 How It Works

### For Students (Regular Users)

```
1. Sign Up
   ↓
2. Verify Email (Supabase Auth sends verification)
   ↓
3. Browse Professors/Colleges
   ↓
4. Submit Anonymous Reviews
   ↓
5. Vote on Reviews (Upvote/Downvote)
   ↓
6. Flag Inappropriate Content
   ↓
7. Manage Your Reviews (My Reviews page)
```

### For Admins

```
1. Login via Admin Panel (special credentials)
   ↓
2. Dashboard shows stats (users, reviews, flags)
   ↓
3. Moderate Flagged Reviews
   ↓
4. Approve/Reject Pending Professors
   ↓
5. Manage Users (ban, warn, view activity)
   ↓
6. View Analytics & Trends
```

### Review Submission Flow (Privacy-First)

```
User writes review
  ↓
Frontend sends to: POST /api/reviews
  ↓
Backend (with service role):
  1. Insert review WITHOUT user_id → Get review_id (UUID)
  2. Insert into review_author_mappings table:
     - review_id: UUID
     - author_id: user's ID
     - RLS: Only service role can access this table
  3. If mapping fails → Delete review (rollback)
  ↓
✅ Review is public & anonymous
✅ User can still edit/delete (backend checks mapping)
✅ No one can see who wrote what
```

---

## 🏗️ Tech Stack & Architecture

### Frontend (Next.js 14 + TypeScript)

**Framework:** Next.js 14 with App Router  
**Language:** TypeScript  
**Styling:** Tailwind CSS  
**UI:** Custom components + Lucide icons  
**State:** React Hooks + Context API  
**Auth:** Supabase Auth (email/password)  
**Hosting:** GitHub Pages (static export)  

**Key Files:**
```
frontend/src/
├── pages/
│   ├── index.tsx              # Homepage
│   ├── admin.tsx              # Admin panel (JUST FIXED)
│   ├── my-reviews.tsx         # User's reviews
│   ├── profile.tsx            # User profile
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── verify-email.tsx
│   ├── professors/
│   │   ├── [id].tsx           # Professor detail page
│   │   └── add.tsx            # Add new professor
│   └── colleges/
│       ├── [id].tsx           # College detail page
│       └── add.tsx            # Add new college
├── components/
│   ├── UserDropdown.tsx       # "Hey {username}" greeting
│   ├── ReviewSubmissionForm.tsx
│   ├── CollegeReviewForm.tsx
│   └── AdminPanel.tsx
└── lib/
    └── supabase.ts            # Supabase client config
```

### Backend (FastAPI + Python 3.11)

**Framework:** FastAPI  
**Language:** Python 3.11  
**Database:** PostgreSQL (via Supabase)  
**Auth:** JWT tokens (Supabase Auth)  
**Hosting:** Railway.app  
**Docs:** Auto-generated Swagger/OpenAPI  

**Key Files:**
```
backend/src/
├── main.py                    # FastAPI app entry
├── api/
│   ├── auth.py                # Authentication endpoints
│   ├── professors.py          # Professor CRUD
│   ├── colleges.py            # College CRUD
│   ├── reviews.py             # Professor reviews (FIXED: uses service role)
│   ├── college_reviews.py     # College reviews (mapping table)
│   ├── moderation.py          # Admin panel endpoints (JUST FIXED)
│   ├── college_review_moderation.py
│   └── user_limits.py         # Rate limiting
├── models/
│   ├── review.py
│   ├── college_review.py
│   ├── professor.py
│   └── user.py
├── services/
│   ├── content_filter.py      # AI profanity/spam detection
│   └── auto_flagging.py       # Auto-flag suspicious content
└── lib/
    ├── database.py            # Supabase clients (CRITICAL FILE)
    ├── auth.py                # JWT verification
    └── rate_limiting.py
```

### Database (Supabase PostgreSQL)

**Provider:** Supabase  
**Type:** PostgreSQL 15  
**Security:** Row Level Security (RLS) enabled  
**Auth:** Supabase Auth (email verification)  

**Key Tables:**
```sql
-- Core Data Tables
professors              # Professor profiles
colleges                # College profiles
professor_reviews       # Anonymous professor reviews (NO user_id!)
college_reviews         # Anonymous college reviews (NO user_id!)

-- Privacy Mapping Tables (RLS Protected)
review_author_mappings           # Maps professor reviews to authors
college_review_author_mappings   # Maps college reviews to authors

-- Voting & Engagement
review_votes                     # Upvote/downvote on professor reviews
college_review_votes             # Upvote/downvote on college reviews
review_flags                     # Flagged professor reviews
college_review_flags             # Flagged college reviews

-- Moderation
auto_flagged_reviews             # Auto-flagged by AI
auto_flagged_college_reviews
pending_professors               # Professors awaiting approval

-- User Management
user_activities                  # Activity logs
user_communications              # Warnings, bans, appeals
```

### Infrastructure & Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                        ratemyprof.me                         │
│                    (GitHub Pages + DNS)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│                   (Static HTML/CSS/JS)                       │
│                    Hosted on GitHub Pages                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Railway)                   │
│            ratemyprof-api.railway.app/v1                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Service Role Client (Admin Operations)             │   │
│  │  - Bypasses RLS                                      │   │
│  │  - Inserts into mapping tables                       │   │
│  │  - Admin panel queries                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Anonymous Client (Public Operations)               │   │
│  │  - Regular API calls                                 │   │
│  │  - Subject to RLS policies                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                Supabase (PostgreSQL + Auth)                  │
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  PostgreSQL Database │  │   Supabase Auth      │        │
│  │  - Reviews           │  │   - Email verification│        │
│  │  - Professors        │  │   - JWT tokens        │        │
│  │  │- Colleges          │  │   - Password reset    │        │
│  │  - Mapping tables    │  │   - User metadata     │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ratemyprof/
│
├── 📱 frontend/                           # Next.js 14 Application
│   ├── src/
│   │   ├── pages/                         # Route pages
│   │   │   ├── index.tsx                  # Homepage
│   │   │   ├── admin.tsx                  # ✅ FIXED: User verification display
│   │   │   ├── admin-login.tsx            # Admin login
│   │   │   ├── my-reviews.tsx             # User's reviews
│   │   │   ├── profile.tsx                # User profile
│   │   │   ├── auth/
│   │   │   │   ├── login.tsx              # User login
│   │   │   │   ├── signup.tsx             # User signup
│   │   │   │   └── verify-email.tsx       # Email verification
│   │   │   ├── professors/
│   │   │   │   ├── [id].tsx               # Professor details
│   │   │   │   └── add.tsx                # Add professor
│   │   │   ├── colleges/
│   │   │   │   ├── [id].tsx               # College details
│   │   │   │   └── add.tsx                # Add college
│   │   │   ├── privacy.tsx                # Privacy policy
│   │   │   ├── terms.tsx                  # Terms of service
│   │   │   ├── guidelines.tsx             # Community guidelines
│   │   │   ├── about.tsx
│   │   │   ├── contact.tsx
│   │   │   └── help.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── UserDropdown.tsx           # User greeting & menu
│   │   │   ├── ReviewSubmissionForm.tsx   # Professor review form
│   │   │   ├── CollegeReviewForm.tsx      # College review form
│   │   │   └── AdminPanel.tsx             # Admin dashboard
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx            # Auth state management
│   │   │
│   │   └── lib/
│   │       └── supabase.ts                # Supabase client
│   │
│   ├── public/
│   │   ├── .nojekyll                      # GitHub Pages config
│   │   └── favicon.ico
│   │
│   ├── next.config.js                     # output: 'export' for static build
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── 🐍 backend/                            # FastAPI Application
│   ├── src/
│   │   ├── main.py                        # App entry point
│   │   │
│   │   ├── api/                           # Endpoints
│   │   │   ├── auth.py                    # User auth
│   │   │   ├── professors.py              # Professor CRUD
│   │   │   ├── colleges.py                # College CRUD
│   │   │   ├── reviews.py                 # ✅ FIXED: Uses service role client
│   │   │   ├── college_reviews.py         # College reviews with mapping
│   │   │   ├── moderation.py              # ✅ FIXED: Admin endpoints
│   │   │   ├── college_review_moderation.py
│   │   │   └── user_limits.py
│   │   │
│   │   ├── models/                        # Pydantic models
│   │   │   ├── review.py
│   │   │   ├── college_review.py
│   │   │   ├── professor.py
│   │   │   ├── college.py
│   │   │   └── user.py
│   │   │
│   │   ├── services/                      # Business logic
│   │   │   ├── content_filter.py          # AI moderation
│   │   │   └── auto_flagging.py
│   │   │
│   │   └── lib/                           # Utilities
│   │       ├── database.py                # ✅ CRITICAL: Exports supabase_admin
│   │       ├── auth.py                    # JWT verification
│   │       └── rate_limiting.py
│   │
│   ├── tests/                             # Test suite
│   ├── scripts/                           # Database scripts
│   ├── requirements.txt                   # Python dependencies
│   ├── pyproject.toml                     # Project config
│   └── .env.example                       # Environment template
│
├── 📜 scripts/                            # Database Setup
│   ├── create_users_table.sql
│   ├── create_missing_tables.sql
│   ├── create_auto_flagging_tables.sql
│   ├── create_user_activities_table.sql
│   ├── create_user_communication_tables.sql
│   ├── create_college_review_author_mappings.sql
│   ├── create_college_review_moderation_tables.sql
│   └── migrate_to_anonymous_reviews.sql
│
├── 📝 Documentation
│   ├── README.md                          # Main documentation
│   ├── PROJECT_OVERVIEW_2025.md           # 👈 THIS FILE
│   ├── MODERATION_SYSTEM.md               # Moderation docs
│   ├── FIXES_APPLIED.md                   # Recent fixes
│   └── memory/
│       ├── constitution.md                # Project principles
│       └── constitution_update_checklist.md
│
├── 🔧 Configuration
│   ├── .github/
│   │   └── workflows/
│   │       └── deploy-github-pages.yml    # Auto-deploy to GH Pages
│   ├── .gitignore
│   ├── railway.json                       # Railway deployment config
│   ├── start-dev.bat                      # Windows dev launcher
│   └── start-dev.ps1                      # PowerShell dev launcher
│
└── 🧪 Test Files (Root Level)
    ├── test_api_with_token.py
    ├── test_college_join.py
    ├── check_professor_verification.py
    └── check_user_reviews.py
```

---

## ✨ Key Features

### 🎓 Student Features

1. **Anonymous Review System**
   - Submit reviews without revealing identity
   - Edit/delete your own reviews
   - Ratings on multiple dimensions (Overall, Clarity, Helpfulness, Difficulty)

2. **Voting System**
   - Upvote helpful reviews
   - Downvote unhelpful/spam reviews
   - Community-driven quality control

3. **Content Flagging**
   - Flag inappropriate reviews
   - Report spam or fake reviews
   - Help maintain platform quality

4. **User Dashboard**
   - View all your reviews in one place
   - Edit or delete reviews
   - Track your contributions
   - See voting stats

5. **Professor/College Search**
   - Search by name, department, college
   - Filter by ratings
   - Sort by review count, date, rating

6. **Add New Entries**
   - Submit new professors (pending admin approval)
   - Add new colleges
   - Contribute to growing database

### 🛡️ Admin Features (Admin Panel)

1. **Dashboard Analytics** ✅ FIXED
   - Total users (with verification status)
   - Total professors & colleges
   - Flagged reviews count
   - Pending approvals
   - Recent activity

2. **User Management** ✅ FIXED
   - View all users with verification status
   - See user activity (reviews, flags submitted)
   - Ban/unban users
   - Track user behavior

3. **Review Moderation**
   - View flagged professor reviews
   - View flagged college reviews
   - Approve or reject reviews
   - See flag reasons and context

4. **Professor Approval**
   - Review pending professor submissions
   - Approve or reject new professors
   - Verify professor information

5. **College Review Moderation**
   - Moderate college reviews
   - Handle flagged content
   - Ensure quality standards

6. **Bulk Operations**
   - Select multiple items
   - Bulk approve/reject
   - Mass actions for efficiency

### 🤖 AI/Automated Features

1. **Content Filtering**
   - Profanity detection (better-profanity)
   - Spam detection (ML classifier)
   - Sentiment analysis (TextBlob)
   - Auto-flagging suspicious content

2. **Review Quality Control**
   - Minimum length requirements
   - Duplicate detection
   - Coherence checking
   - Rating consistency validation

3. **User Behavior Monitoring**
   - Rate limiting (prevent spam)
   - Activity tracking
   - Suspicious pattern detection

---

## 🗄️ Database Schema

### Core Tables

#### `professors`
```sql
CREATE TABLE professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT,
  college_id UUID REFERENCES colleges(id),
  email TEXT,
  bio TEXT,
  total_reviews INT DEFAULT 0,
  average_rating FLOAT DEFAULT 0.0,
  is_verified BOOLEAN DEFAULT false,  -- Admin approval
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `colleges`
```sql
CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  type TEXT,  -- Engineering, Medical, Arts, etc.
  total_reviews INT DEFAULT 0,
  average_rating FLOAT DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `professor_reviews` (Anonymous)
```sql
CREATE TABLE professor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professors(id),
  -- NO user_id column! ← Privacy-first design
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  clarity_rating INT,
  helpfulness_rating INT,
  difficulty_rating INT,
  review_text TEXT,
  course_name TEXT,
  would_take_again BOOLEAN,
  grade_received TEXT,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `college_reviews` (Anonymous)
```sql
CREATE TABLE college_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES colleges(id),
  -- NO user_id column! ← Privacy-first design
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  academics_rating INT,
  facilities_rating INT,
  placements_rating INT,
  campus_life_rating INT,
  review_text TEXT,
  course_name TEXT,
  graduation_year INT,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Privacy Mapping Tables (RLS Protected)

#### `review_author_mappings`
```sql
CREATE TABLE review_author_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES professor_reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,  -- References auth.users (Supabase Auth)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id)  -- One author per review
);

-- RLS Policy: Only service role can access
ALTER TABLE review_author_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON review_author_mappings
  FOR ALL USING (auth.role() = 'service_role');
```

#### `college_review_author_mappings`
```sql
CREATE TABLE college_review_author_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,  -- References auth.users
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id)
);

-- RLS Policy: Only service role
ALTER TABLE college_review_author_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON college_review_author_mappings
  FOR ALL USING (auth.role() = 'service_role');
```

### Voting & Engagement Tables

#### `review_votes`
```sql
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES professor_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, user_id)  -- One vote per user per review
);
```

#### `college_review_votes`
```sql
CREATE TABLE college_review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);
```

#### `review_flags`
```sql
CREATE TABLE review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES professor_reviews(id) ON DELETE CASCADE,
  flagger_email TEXT NOT NULL,  -- Email of person who flagged
  reason TEXT NOT NULL,  -- spam, inappropriate, fake, etc.
  additional_context TEXT,
  status TEXT DEFAULT 'pending',  -- pending, reviewed, dismissed
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Moderation Tables

#### `auto_flagged_reviews`
```sql
CREATE TABLE auto_flagged_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES professor_reviews(id),
  flag_reason TEXT NOT NULL,  -- profanity, spam, low_quality
  confidence_score FLOAT,  -- 0.0 to 1.0
  reviewed BOOLEAN DEFAULT false,
  admin_action TEXT,  -- approved, rejected, edited
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `pending_professors`
```sql
CREATE TABLE pending_professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT,
  college_id UUID REFERENCES colleges(id),
  email TEXT,
  submitted_by UUID,  -- User who submitted
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  reviewed_by UUID,  -- Admin who reviewed
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Management Tables

#### `user_activities`
```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,  -- review_submit, review_vote, review_flag
  target_id UUID,  -- ID of review/professor/college
  metadata JSONB,  -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_communications`
```sql
CREATE TABLE user_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  communication_type TEXT NOT NULL,  -- warning, ban, appeal, unban
  reason TEXT NOT NULL,
  admin_id UUID,
  status TEXT DEFAULT 'active',  -- active, resolved
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### Base URL
- **Development:** `http://localhost:8000/v1`
- **Production:** `https://ratemyprof-api.railway.app/v1`

### Authentication Endpoints (`/api/auth`)

```
POST   /api/auth/signup          # User registration
POST   /api/auth/login           # User login
POST   /api/auth/logout          # User logout
GET    /api/auth/verify-email    # Email verification callback
POST   /api/auth/reset-password  # Request password reset
```

### Professor Endpoints (`/api/professors`)

```
GET    /api/professors                    # List all professors
GET    /api/professors/{id}               # Get professor details
POST   /api/professors                    # Add professor (pending approval)
PUT    /api/professors/{id}               # Update professor (admin only)
DELETE /api/professors/{id}               # Delete professor (admin only)
GET    /api/professors/{id}/reviews       # Get reviews for professor
```

### College Endpoints (`/api/colleges`)

```
GET    /api/colleges                      # List all colleges
GET    /api/colleges/{id}                 # Get college details
POST   /api/colleges                      # Add college
PUT    /api/colleges/{id}                 # Update college (admin only)
DELETE /api/colleges/{id}                 # Delete college (admin only)
GET    /api/colleges/{id}/reviews         # Get reviews for college
```

### Review Endpoints (`/api/reviews`)

```
GET    /api/reviews                       # List reviews (with filters)
GET    /api/reviews/{id}                  # Get single review
POST   /api/reviews                       # ✅ FIXED: Submit review (uses service role)
PUT    /api/reviews/{id}                  # Edit review (author only)
DELETE /api/reviews/{id}                  # Delete review (author only)
POST   /api/reviews/{id}/vote             # Upvote/downvote review
POST   /api/reviews/{id}/flag             # Flag review
```

### College Review Endpoints (`/api/college-reviews`)

```
GET    /api/college-reviews               # List college reviews
GET    /api/college-reviews/{id}          # Get single college review
POST   /api/college-reviews               # Submit college review
PUT    /api/college-reviews/{id}          # Edit college review
DELETE /api/college-reviews/{id}          # Delete college review
POST   /api/college-reviews/{id}/vote     # Vote on college review
POST   /api/college-reviews/{id}/flag     # Flag college review
```

### Moderation Endpoints (`/api/moderation`) - Admin Only

```
GET    /api/moderation/dashboard/stats    # ✅ FIXED: Dashboard stats with is_verified
GET    /api/moderation/users              # ✅ FIXED: List all users with verification
GET    /api/moderation/users/{id}         # Get user details
POST   /api/moderation/users/{id}/ban     # Ban user
POST   /api/moderation/users/{id}/unban   # Unban user

GET    /api/moderation/reviews            # List flagged professor reviews
PUT    /api/moderation/reviews/{id}       # Approve/reject review

GET    /api/moderation/college-reviews    # List flagged college reviews
PUT    /api/moderation/college-reviews/{id}  # Approve/reject college review

GET    /api/moderation/professors/pending # List pending professors
PUT    /api/moderation/professors/{id}    # Approve/reject professor
```

### User Endpoints (`/api/users`)

```
GET    /api/users/me                      # Get current user profile
GET    /api/users/me/reviews              # Get user's reviews
PUT    /api/users/me                      # Update profile
```

---

## 🔧 Recent Fixes & Updates (October 30, 2025)

### 🐛 Bug Fixed: User Verification Display in Admin Panel

**Issue:**
- Users completing email verification still showed as "unverified" in admin panel
- Admin panel showed only 5 users initially, then 11 users after delay
- Intermittent display issues

**Root Cause:**
1. Frontend expected `is_verified` field, backend only returned `is_active`
2. `/api/moderation/stats` endpoint returned 5 recent users without `is_verified`
3. Multiple user-loading functions overwriting each other

**Fixes Applied:**

**Commit 1: `d095a20`** - Added `is_verified` field to backend
```python
# backend/src/api/moderation.py
class UserInfo(BaseModel):
    # ... other fields ...
    is_verified: bool  # Email confirmation status

# Set is_verified based on email_confirmed_at
user_info.is_verified = auth_user.email_confirmed_at is not None
```

**Commit 2: `8454e6e`** - Fixed stats endpoint
```python
# backend/src/api/moderation.py - Line 2987
recent_users.append({
    # ... other fields ...
    "is_verified": auth_user.email_confirmed_at is not None,  # ← Added
})
```

**Commit 3: `8fbca44`** - Fixed frontend user mapping
```typescript
// frontend/src/pages/admin.tsx - Line 483
realUsers = usersData.map((user: any) => ({
  // ... other fields ...
  is_verified: user.is_verified  // ← Added
}));
```

**Commit 4: `98bf190`** - Added usersLoaded flag
```typescript
// frontend/src/pages/admin.tsx
const [usersLoaded, setUsersLoaded] = useState(false);

// Only load users when Users tab is clicked, not on dashboard load
useEffect(() => {
  if (activeTab === 'users' && !usersLoaded) {
    loadAllUsers();
  }
}, [activeTab]);
```

**Commit 5: `e2936cd`** - Removed redundant user loading
```typescript
// Removed duplicate user loading from fallback code
// Users only load when Users tab is clicked
```

**Result:** ✅ Admin panel now correctly shows all users with proper verification status immediately

---

### Previous Fixes

**Account Deletion Fix** (Earlier)
- Fixed delete user functionality
- Properly cascade deletes to mapping tables

**Review Submission Fix** (Critical)
- Backend now uses `supabase_admin` client to bypass RLS
- Reviews can be inserted into mapping tables
- Privacy maintained while functionality restored

**College Review System** (Major Feature)
- Complete college rating system with anonymous mapping
- Separate moderation pipeline
- Voting and flagging support

**Admin Panel Build** (Major Feature)
- Unified dashboard with stats
- User management with verification status
- Review moderation (professor & college)
- Bulk operations support

---

## 🚀 Deployment Setup

### Current Deployment

**Frontend:** GitHub Pages (Static Export)
- **URL:** https://ratemyprof.me
- **Deploy:** Automatic on push to `main` branch
- **Build:** `npm run build` (creates static HTML/CSS/JS)
- **Config:** `next.config.js` has `output: 'export'`

**Backend:** Railway.app
- **URL:** https://ratemyprof-api.railway.app
- **Deploy:** Automatic on push to `main` branch
- **Runtime:** Python 3.11 + uvicorn
- **Config:** `railway.json` specifies build/start commands

**Database:** Supabase (PostgreSQL + Auth)
- **Region:** US East
- **Plan:** Free tier (upgradable)
- **Features:** Auth, Database, Storage, RLS

### Environment Variables

**Frontend (`.env.local`):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
NEXT_PUBLIC_API_URL=https://ratemyprof-api.railway.app/v1
```

**Backend (Railway Environment):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...  # ← CRITICAL for admin operations
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
FRONTEND_URL=https://ratemyprof.me
```

### Deployment Commands

**Frontend (GitHub Actions does this automatically):**
```bash
cd frontend
npm install
npm run build  # Creates /out directory
# GitHub Pages serves /out as static site
```

**Backend (Railway does this automatically):**
```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

---

## 🏃 How to Run Locally

### Prerequisites

- Node.js 18+ and npm 9+
- Python 3.11+
- Git
- Supabase account (free)

### Quick Start

1. **Clone repository**
```bash
git clone https://github.com/NihaallX/ratemyprof.git
cd ratemyprof
```

2. **Setup backend**
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
EOF
```

3. **Setup frontend**
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
EOF
```

4. **Setup database**
```bash
# In Supabase SQL Editor, run these scripts in order:
# 1. scripts/create_users_table.sql
# 2. scripts/create_missing_tables.sql
# 3. scripts/create_auto_flagging_tables.sql
# 4. scripts/create_user_activities_table.sql
# 5. scripts/create_user_communication_tables.sql
# 6. scripts/create_college_review_author_mappings.sql
# 7. scripts/create_college_review_moderation_tables.sql
```

5. **Start development servers**

**Option A: Automatic (Windows)**
```bash
# From project root
start-dev.bat
```

**Option B: Manual**
```bash
# Terminal 1 - Backend
cd backend
uvicorn src.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/v1
- API Docs: http://localhost:8000/docs

---

## 📋 Current Issues & Todo

### Known Issues

1. **Testing Coverage** - Only 65% test coverage, need more tests
2. **Mobile UI** - Some responsive design issues on small screens
3. **Performance** - Large datasets (1000+ professors) load slowly
4. **Search** - Basic search, needs advanced filtering

### High Priority Todo

- [ ] Complete production deployment (backend to Railway)
- [ ] Set up custom domain DNS properly
- [ ] Add comprehensive error monitoring (Sentry)
- [ ] Implement email notifications (verification, bans, etc.)
- [ ] Add rate limiting to prevent abuse
- [ ] Implement pagination for large datasets

### Medium Priority Todo

- [ ] Add advanced search (Elasticsearch/Algolia)
- [ ] Implement caching (Redis)
- [ ] Add analytics dashboard (for admins)
- [ ] Create mobile app (React Native)
- [ ] Add multi-language support (Hindi)
- [ ] Implement professor comparison tool

### Low Priority / Future

- [ ] Course reviews (in addition to professor reviews)
- [ ] Verified student badges
- [ ] Premium features for colleges
- [ ] AI review summarization
- [ ] Social features (follow users, share reviews)

---

## 🎓 How to Understand This Project (For New Developers)

### Start Here

1. **Read this document first** - You're doing it! ✅
2. **Explore the live site** - Visit https://ratemyprof.me
3. **Check the README** - Read `README.md` for setup instructions
4. **Run it locally** - Follow "How to Run Locally" section above

### Key Concepts to Understand

1. **Privacy-First Architecture**
   - Reviews are stored WITHOUT user_id
   - Mapping tables link reviews to authors (RLS protected)
   - Only backend (service role) can access mappings

2. **Supabase Service Role vs Anon Key**
   - `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS, used in backend for admin operations
   - `SUPABASE_ANON_KEY` - Subject to RLS, used in frontend for user operations

3. **Two-Step Review Submission**
   - Step 1: Insert review → Get UUID
   - Step 2: Insert mapping (review_id + author_id)
   - If Step 2 fails → Delete review (rollback)

4. **Admin Panel Authentication**
   - Separate from user auth
   - Uses JWT tokens stored in localStorage
   - Special endpoints require admin token

### File Reading Order

**Backend:**
1. `backend/src/lib/database.py` - Understand Supabase clients
2. `backend/src/main.py` - See how app is structured
3. `backend/src/api/reviews.py` - Understand review submission flow
4. `backend/src/api/moderation.py` - Learn admin operations

**Frontend:**
1. `frontend/src/lib/supabase.ts` - Supabase client setup
2. `frontend/src/pages/index.tsx` - Homepage flow
3. `frontend/src/pages/admin.tsx` - Admin panel (just fixed!)
4. `frontend/src/components/ReviewSubmissionForm.tsx` - How reviews are submitted

### Common Questions

**Q: Why are reviews anonymous?**
A: Privacy is core to the platform. Students should feel safe sharing honest feedback without fear of retaliation.

**Q: How do users edit their reviews if they're anonymous?**
A: Backend checks the mapping table using service role. If `author_id` matches current user, edit/delete is allowed.

**Q: Why two Supabase clients?**
A: `supabase` (anon) is for public operations. `supabase_admin` (service role) is for privileged operations like inserting into mapping tables.

**Q: What happens if a user deletes their account?**
A: Reviews remain (anonymous), but mapping is deleted. User loses ability to edit/delete their reviews.

**Q: How are suspicious reviews detected?**
A: AI content filter checks for profanity, spam patterns, sentiment extremes, and duplicate content.

---

## 📞 Contact & Support

- **Repository:** https://github.com/NihaallX/ratemyprof
- **Issues:** https://github.com/NihaallX/ratemyprof/issues
- **Discussions:** https://github.com/NihaallX/ratemyprof/discussions

---

## 📜 License

MIT License - See `LICENSE` file for details.

---

**Last Updated:** October 30, 2025  
**Version:** 1.3  
**Status:** Production Ready (90% Complete)  
**Next Milestone:** Full production deployment + beta launch
