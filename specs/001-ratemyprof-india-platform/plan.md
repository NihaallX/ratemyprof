# Implementation Plan: RateMyProf India Platform

**Branch**: `001-ratemyprof-india-platform` | **Date**: September 10, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ratemyprof-india-platform/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
A comprehensive web platform for Indian students to rate, review, and discover professors across colleges/universities in India. The platform features anonymous review capability with moderation, multi-category rating system (clarity, helpfulness, workload, engagement), and culturally appropriate design for the Indian academic environment. Technical approach involves a modern web application with frontend-backend separation for scalability and maintainability.

## Technical Context
**Language/Version**: Python 3.11 (backend), JavaScript/TypeScript with React (frontend)  
**Primary Dependencies**: FastAPI (backend API), Next.js/React (frontend), PostgreSQL (database)  
**Storage**: PostgreSQL with full-text search (GIN indexes), AWS S3/DigitalOcean Spaces for images  
**Testing**: Pytest (backend), Jest/React Testing Library (frontend)  
**Target Platform**: Web application - Linux server (backend), Modern browsers (frontend)
**Project Type**: web - determines source structure (frontend + backend)  
**Performance Goals**: <200ms API response time, handle 1000+ concurrent users, <2s page load  
**Constraints**: Mobile-first responsive design, UTF-8 support for regional languages, Indian data compliance  
**Scale/Scope**: MVP for 10k+ students, 1000+ colleges, 50k+ professors, expandable to national scale

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (backend-api, frontend-web) - within max 3 limit
- Using framework directly? Yes - FastAPI and Next.js without wrapper abstractions
- Single data model? Yes - shared schema between frontend/backend, no separate DTOs
- Avoiding patterns? Yes - direct database access via SQLAlchemy ORM, no Repository pattern

**Architecture**:
- EVERY feature as library? Yes - auth, ratings, search, moderation as separate libraries
- Libraries listed: auth-lib (authentication/authorization), ratings-lib (professor ratings), search-lib (professor discovery), moderation-lib (content review)
- CLI per library: --help/--version/--format for each library management
- Library docs: llms.txt format planned for AI context

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes - tests written first, must fail, then implement
- Git commits show tests before implementation? Yes - commit pattern: test-contract → test-integration → implementation
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes - actual PostgreSQL database for integration tests
- Integration tests for: new libraries, contract changes, shared schemas? Yes
- FORBIDDEN: Implementation before test, skipping RED phase - ENFORCED

**Observability**:
- Structured logging included? Yes - JSON logging with request IDs, user context
- Frontend logs → backend? Yes - centralized logging via API endpoint
- Error context sufficient? Yes - stack traces, user actions, system state

**Versioning**:
- Version number assigned? v0.1.0 (MAJOR.MINOR.BUILD)
- BUILD increments on every change? Yes - automated via CI/CD
- Breaking changes handled? Yes - API versioning, migration scripts, parallel testing

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (frontend + backend detected)
backend/
├── src/
│   ├── models/          # SQLAlchemy models (User, College, Professor, Review)
│   ├── services/        # Business logic libraries (auth, ratings, search, moderation)
│   ├── api/            # FastAPI route handlers
│   └── lib/            # Shared utilities (validation, logging, config)
└── tests/
    ├── contract/       # API contract tests (OpenAPI validation)
    ├── integration/    # Database integration tests
    └── unit/          # Service unit tests

frontend/
├── src/
│   ├── components/     # React components (search, profile, review forms)
│   ├── pages/         # Next.js pages (landing, professor, review, moderation)
│   ├── services/      # API client libraries
│   └── lib/           # Shared utilities (validation, formatting, auth)
└── tests/
    ├── integration/    # Page integration tests
    ├── component/      # Component unit tests
    └── e2e/           # End-to-end user flows
```

**Structure Decision**: Option 2 - Web application (frontend + backend separation for scalability)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Database setup and migrations: 7 entity creation tasks [P]
- API contract implementation: 15 endpoint tasks following OpenAPI spec
- Frontend component development: 12 UI component tasks [P]
- Authentication system: 4 auth flow tasks 
- Search functionality: 3 search implementation tasks
- Moderation system: 5 moderation workflow tasks
- Testing tasks: Contract tests (15) + Integration tests (20) + E2E tests (5)

**Ordering Strategy**:
- **Phase 1**: TDD setup - Contract tests for all endpoints FIRST (must fail)
- **Phase 2**: Data layer - Database models, migrations, seed data [P]
- **Phase 3**: Backend services - API implementation to pass contract tests
- **Phase 4**: Frontend foundation - Authentication, routing, basic components [P]
- **Phase 5**: Feature integration - Search, review submission, professor profiles
- **Phase 6**: Moderation system - Admin dashboard, flagging, actions
- **Phase 7**: Integration testing - Full user scenarios from quickstart.md
- **Phase 8**: Performance & deployment - Load testing, production setup

**Estimated Output**: 65-70 numbered, ordered tasks in tasks.md
- Contract tests: 15 tasks [P] (all API endpoints)
- Database: 7 tasks [P] (models, migrations, indexing)
- Backend APIs: 15 tasks (implement contracts)
- Frontend components: 12 tasks [P] (independent UI pieces)
- Authentication: 4 tasks (login, signup, verification, JWT)
- Search system: 3 tasks (indexing, queries, ranking)
- Moderation: 5 tasks (flagging, dashboard, actions)
- Integration tests: 8 tasks (quickstart scenarios)
- Performance: 3 tasks (load testing, optimization)
- Deployment: 3 tasks (staging, production, monitoring)

**Parallelization**: Tasks marked [P] can run simultaneously as they work on independent files/components

**Constitutional Compliance**:
- Every implementation task has corresponding test task that MUST be completed first
- Tests must fail before implementation (RED-GREEN-Refactor enforced)
- Library-first approach: Each major feature (auth, search, moderation) as separate library
- CLI interfaces for each library with --help, --version, --format flags
- Real database used for integration tests (no mocking)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*