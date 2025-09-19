# Tasks: RateMyProf India Platform

**Input**: Design documents from `/specs/001-ratemyprof-india-platform/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Loaded: Tech stack (Python/FastAPI + Next.js/React), web structure
   → Extract: Backend/frontend separation, PostgreSQL database
2. Load optional design documents:
   → data-model.md: Extract entities → User, College, Professor, Review, ReviewFlag, ModerationLog
   → contracts/: api-specification.yaml → 12 endpoints contract tests
   → research.md: Extract decisions → search, auth, moderation strategies
   → quickstart.md: 5 scenarios → integration tests
3. Generate tasks by category:
   → Setup: project init, dependencies, linting, database
   → Tests: 12 contract tests, 5 integration tests
   → Core: 6 models, 4 services, 12 API endpoints
   → Integration: DB, middleware, logging, search indexing
   → Polish: unit tests, performance, docs, deployment
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests? YES (12 endpoints → 12 tests)
   → All entities have models? YES (6 entities → 6 model tasks)
   → All endpoints implemented? YES (12 contracts → 12 implementations)
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow web application structure from plan.md

## Phase 3.1: Setup & Infrastructure
- [x] T001 Create backend project structure in `backend/` with FastAPI dependencies
- [x] T002 Create frontend project structure in `frontend/` with Next.js/React dependencies
- [x] T003 [P] Configure Python linting (black, flake8, mypy) in `backend/pyproject.toml`
- [x] T004 [P] Configure TypeScript/ESLint in `frontend/.eslintrc.js`
- [x] T005 [P] Setup PostgreSQL database schema in `backend/alembic/versions/001_initial_schema.py`
- [x] T006 [P] Configure GitHub Actions CI/CD in `.github/workflows/ci.yml`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Backend Contract Tests
- [x] T007 [P] Contract test GET /professors in `backend/tests/contract/test_professors_search.py`
- [x] T008 [P] Contract test GET /professors/{id} in `backend/tests/contract/test_professors_get.py`
- [x] T009 [P] Contract test POST /reviews in `backend/tests/contract/test_reviews_create.py`
- [ ] T010 [P] Contract test PUT /reviews/{id} in `backend/tests/contract/test_reviews_update.py`
- [ ] T011 [P] Contract test POST /reviews/{id}/flag in `backend/tests/contract/test_reviews_flag.py`
- [x] T012 [P] Contract test POST /auth/signup in `backend/tests/contract/test_auth_signup.py`
- [ ] T013 [P] Contract test POST /auth/login in `backend/tests/contract/test_auth_login.py`
- [ ] T014 [P] Contract test POST /auth/verify in `backend/tests/contract/test_auth_verify.py`
- [ ] T015 [P] Contract test GET /colleges in `backend/tests/contract/test_colleges_search.py`
- [ ] T016 [P] Contract test GET /moderation/reviews in `backend/tests/contract/test_moderation_list.py`
- [ ] T017 [P] Contract test POST /moderation/reviews/{id}/action in `backend/tests/contract/test_moderation_action.py`

### Integration Tests (Quickstart Scenarios)
- [x] T018 [P] Integration test student discovery and review flow in `backend/tests/integration/test_student_review_flow.py`
- [ ] T019 [P] Integration test community moderation workflow in `backend/tests/integration/test_moderation_workflow.py`
- [ ] T020 [P] Integration test anonymous review accountability in `backend/tests/integration/test_anonymous_reviews.py`
- [ ] T021 [P] Integration test multi-college search in `backend/tests/integration/test_cross_college_search.py`
- [ ] T022 [P] Integration test mobile user experience in `frontend/tests/integration/test_mobile_experience.spec.ts`

## Phase 3.3: Backend Core Implementation (ONLY after tests are failing)

### Database Models
- [ ] T023 [P] User model in `backend/src/models/user.py`
- [ ] T024 [P] College model in `backend/src/models/college.py`
- [ ] T025 [P] Professor model in `backend/src/models/professor.py`
- [ ] T026 [P] Review model in `backend/src/models/review.py`
- [ ] T027 [P] ReviewFlag model in `backend/src/models/review_flag.py`
- [ ] T028 [P] ModerationLog model in `backend/src/models/moderation_log.py`

### Service Libraries
- [ ] T029 [P] AuthService with CLI in `backend/src/services/auth_service.py`
- [ ] T030 [P] SearchService with CLI in `backend/src/services/search_service.py`
- [ ] T031 [P] RatingService with CLI in `backend/src/services/rating_service.py`
- [ ] T032 [P] ModerationService with CLI in `backend/src/services/moderation_service.py`

### API Endpoints (Sequential - shared FastAPI app)
- [ ] T033 GET /professors endpoint in `backend/src/api/professors.py`
- [ ] T034 GET /professors/{id} endpoint in `backend/src/api/professors.py`
- [ ] T035 POST /reviews endpoint in `backend/src/api/reviews.py`
- [ ] T036 PUT /reviews/{id} endpoint in `backend/src/api/reviews.py`
- [ ] T037 POST /reviews/{id}/flag endpoint in `backend/src/api/reviews.py`
- [ ] T038 POST /auth/signup endpoint in `backend/src/api/auth.py`
- [ ] T039 POST /auth/login endpoint in `backend/src/api/auth.py`
- [ ] T040 POST /auth/verify endpoint in `backend/src/api/auth.py`
- [ ] T041 GET /colleges endpoint in `backend/src/api/colleges.py`
- [ ] T042 GET /moderation/reviews endpoint in `backend/src/api/moderation.py`
- [ ] T043 POST /moderation/reviews/{id}/action endpoint in `backend/src/api/moderation.py`

## Phase 3.4: Frontend Core Implementation

### React Components
- [ ] T044 [P] SearchForm component in `frontend/src/components/SearchForm.tsx`
- [ ] T045 [P] ProfessorCard component in `frontend/src/components/ProfessorCard.tsx`
- [ ] T046 [P] ProfessorProfile component in `frontend/src/components/ProfessorProfile.tsx`
- [ ] T047 [P] ReviewForm component in `frontend/src/components/ReviewForm.tsx`
- [ ] T048 [P] ReviewCard component in `frontend/src/components/ReviewCard.tsx`
- [ ] T049 [P] ModerationDashboard component in `frontend/src/components/ModerationDashboard.tsx`

### Next.js Pages
- [ ] T050 Landing page in `frontend/src/pages/index.tsx`
- [ ] T051 Professor profile page in `frontend/src/pages/professor/[id].tsx`
- [ ] T052 Review submission page in `frontend/src/pages/review/[professorId].tsx`
- [ ] T053 Login/signup page in `frontend/src/pages/auth/index.tsx`
- [ ] T054 Moderation dashboard page in `frontend/src/pages/admin/moderation.tsx`

### API Client Services
- [ ] T055 [P] Professor API client in `frontend/src/services/professorApi.ts`
- [ ] T056 [P] Review API client in `frontend/src/services/reviewApi.ts`
- [ ] T057 [P] Auth API client in `frontend/src/services/authApi.ts`
- [ ] T058 [P] Moderation API client in `frontend/src/services/moderationApi.ts`

## Phase 3.5: Integration & Infrastructure
- [ ] T059 Database connection and ORM setup in `backend/src/lib/database.py`
- [ ] T060 JWT authentication middleware in `backend/src/lib/auth_middleware.py`
- [ ] T061 Request/response logging middleware in `backend/src/lib/logging_middleware.py`
- [ ] T062 CORS and security headers in `backend/src/lib/security.py`
- [ ] T063 PostgreSQL full-text search indexing in `backend/src/lib/search_indexer.py`
- [ ] T064 Email verification service in `backend/src/lib/email_service.py`
- [ ] T065 Content moderation filters in `backend/src/lib/content_filter.py`

## Phase 3.6: Testing & Quality Assurance
- [ ] T066 [P] Unit tests for auth service in `backend/tests/unit/test_auth_service.py`
- [ ] T067 [P] Unit tests for rating service in `backend/tests/unit/test_rating_service.py`
- [ ] T068 [P] Unit tests for search service in `backend/tests/unit/test_search_service.py`
- [ ] T069 [P] Unit tests for moderation service in `backend/tests/unit/test_moderation_service.py`
- [ ] T070 [P] Component tests for React components in `frontend/tests/component/`
- [ ] T071 [P] E2E tests for critical user flows in `frontend/tests/e2e/user_flows.spec.ts`

## Phase 3.7: Performance & Deployment
- [ ] T072 [P] Performance tests for API endpoints in `backend/tests/performance/test_api_performance.py`
- [ ] T073 [P] Load testing for concurrent users in `backend/tests/performance/test_load.py`
- [ ] T074 [P] Frontend performance optimization in `frontend/src/lib/performance.ts`
- [ ] T075 Docker containerization in `Dockerfile` and `docker-compose.yml`
- [ ] T076 Production deployment configuration in `deploy/production.yml`
- [ ] T077 [P] API documentation generation in `backend/docs/api.md`
- [ ] T078 [P] Frontend documentation in `frontend/README.md`

## Dependencies
**Phase Order**: Setup (T001-T006) → Tests (T007-T022) → Backend (T023-T043) → Frontend (T044-T058) → Integration (T059-T065) → Quality (T066-T071) → Performance (T072-T078)

**Critical Dependencies**:
- All contract tests (T007-T017) MUST complete before any API implementation (T033-T043)
- All integration tests (T018-T022) MUST complete before integration work (T059-T065)
- Database models (T023-T028) must complete before services (T029-T032)
- Services (T029-T032) must complete before API endpoints (T033-T043)
- API endpoints must complete before frontend API clients (T055-T058)

**Blocking Relationships**:
- T005 (database schema) blocks T023-T028 (models)
- T023-T028 (models) block T029-T032 (services)
- T029-T032 (services) block T033-T043 (endpoints)
- T033-T043 (endpoints) block T055-T058 (API clients)
- T055-T058 (API clients) block T050-T054 (pages)

## Parallel Example
```
# Phase 3.2 - Launch all contract tests together:
Task: "Contract test GET /professors in backend/tests/contract/test_professors_search.py"
Task: "Contract test GET /professors/{id} in backend/tests/contract/test_professors_get.py"
Task: "Contract test POST /reviews in backend/tests/contract/test_reviews_create.py"
Task: "Contract test PUT /reviews/{id} in backend/tests/contract/test_reviews_update.py"
Task: "Contract test POST /reviews/{id}/flag in backend/tests/contract/test_reviews_flag.py"
# ... (all T007-T017 can run in parallel)

# Phase 3.3 - Launch all model creation together:
Task: "User model in backend/src/models/user.py"
Task: "College model in backend/src/models/college.py"
Task: "Professor model in backend/src/models/professor.py"
Task: "Review model in backend/src/models/review.py"
Task: "ReviewFlag model in backend/src/models/review_flag.py"
Task: "ModerationLog model in backend/src/models/moderation_log.py"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify all tests fail before implementing
- Commit after each task
- Follow TDD: RED-GREEN-Refactor cycle strictly enforced
- Each service library must include CLI with --help, --version, --format flags

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**: 11 contract files → 11 contract test tasks [P]
2. **From Data Model**: 6 entities → 6 model creation tasks [P]  
3. **From User Stories**: 5 quickstart scenarios → 5 integration tests [P]
4. **Ordering**: Setup → Tests → Models → Services → Endpoints → Frontend → Integration → Polish

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (11 endpoints → 11 contract tests)
- [x] All entities have model tasks (6 entities → 6 model tasks)
- [x] All tests come before implementation (T007-T022 before T023-T043)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD cycle enforced (contract tests must fail before implementation)
- [x] Library-first approach with CLI interfaces for services
- [x] Constitutional compliance verified
