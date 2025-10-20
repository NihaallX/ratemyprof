# Project Cleanup Plan

## ✅ SAFE TO DELETE - Root Directory

### Old Documentation (Completed Features)
- [ ] `ANONYMOUS_REVIEW_QUICK_START.md` - Old guide, feature is complete
- [ ] `ANONYMOUS_REVIEW_SYSTEM_TODO.md` - Old TODO, feature is complete
- [ ] `IMPLEMENTATION_COMPLETE.md` - Old implementation notes
- [ ] `IMPLEMENTATION_SUMMARY.md` - Old summary
- [ ] `NEW_FEATURES_DOCUMENTATION.md` - Old feature docs
- [ ] `SEARCH_AUTOCOMPLETE_IMPLEMENTATION.md` - Feature complete
- [ ] `VISUAL_PROJECT_MAP.md` - Old planning doc
- [ ] `PRE_LAUNCH_CHECKLIST.md` - Planning doc
- [ ] `CHATGPT_LEGAL_PROMPTS.md` - Old prompts/notes

### Temporary/Test Files
- [ ] `json.html` - Test file
- [ ] `landingPage.txt` - Old text file
- [ ] `simple_review.json` - Test data

### Test Cache Directories
- [ ] `pytest-cache-files-g95zw9xo/` - Old pytest cache
- [ ] `.pytest_cache/` - Pytest cache

### Old SQL Scripts (Root)
- [ ] `backfill_review_mappings.sql` - One-time migration, complete
- [ ] `fix_mapping_foreign_key.sql` - One-time fix, complete
- [ ] `recalculate_professor_ratings.sql` - One-time fix, complete
- [ ] `setup_users_table.sql` - Old setup script
- [ ] `supabase_add_is_verified.sql` - One-time migration, complete

### Old Python Scripts (Root)
- [ ] `check_college_reviews_schema.py` - Diagnostic, no longer needed
- [ ] `check_professors_schema.py` - Diagnostic, no longer needed
- [ ] `create_college_review_votes_table.py` - One-time setup, complete
- [ ] `create_review_votes_table.py` - One-time setup, complete
- [ ] `create_user_activities_table.py` - One-time setup, complete
- [ ] `manual_database_setup.py` - Old setup script
- [ ] `setup_database.py` - Old setup script

### Old Test Scripts (Root)
- [ ] `test-anonymous-system.ps1` - Old test script
- [ ] `test-backend-simple.ps1` - Old test script

## ✅ SAFE TO DELETE - Backend Directory

### Diagnostic Scripts (Used Once)
- [ ] `add_is_verified_column.py` - One-time migration
- [ ] `check_and_create_college_reviews.py` - One-time check
- [ ] `check_colleges.py` - Diagnostic
- [ ] `check_database_structure.py` - Diagnostic
- [ ] `check_db_structure.py` - Diagnostic (duplicate)
- [ ] `check_deleted_review.py` - Diagnostic script we created
- [ ] `check_id_consistency.py` - Diagnostic
- [ ] `check_professors.py` - Diagnostic
- [ ] `check_professors_table.py` - Diagnostic
- [ ] `check_reviews_table.py` - Diagnostic
- [ ] `check_review_mappings.py` - Diagnostic script we created
- [ ] `check_specific_prof.py` - Diagnostic
- [ ] `check_top_profs.py` - Diagnostic script we created
- [ ] `clean_test_reviews.py` - One-time cleanup

### One-Time Fix Scripts
- [ ] `cleanup_orphaned_reviews.py` - One-time cleanup we ran
- [ ] `find_orphaned_reviews.py` - Diagnostic script we created
- [ ] `fix_duplicate_ids.py` - One-time fix
- [ ] `fix_duplicate_professors.py` - One-time fix
- [ ] `fix_duplicate_professors_corrected.py` - One-time fix
- [ ] `fix_orphaned_reviews.py` - One-time fix we ran

### One-Time Table Creation
- [ ] `create_college_reviews_table.py` - One-time setup
- [ ] `create_college_reviews_table_direct.py` - One-time setup
- [ ] `setup_auto_flagging.py` - One-time setup
- [ ] `setup_missing_tables.py` - One-time setup

### Test Files
- [ ] `test_admin_login.py` - Old test
- [ ] `test_college_access.py` - Old test
- [ ] `test_content_filter.py` - Old test
- [ ] `test_delete_review.py` - Diagnostic test we created
- [ ] `test_duplicate_prevention.py` - Diagnostic test we created
- [ ] `verify_ml_tools.py` - Old verification script

### Test Cache
- [ ] `pytest-cache-files-lo2_crq6/` - Old pytest cache
- [ ] `.pytest_cache/` - Pytest cache

## ⚠️ REVIEW BUT LIKELY KEEP

### Directories
- [ ] `specs/` - Project specifications (keep for reference)
- [ ] `templates/` - File templates (keep for reference)
- [ ] `memory/` - Context memory (check contents)
- [ ] `scripts/` - May have useful SQL scripts (review)
- [ ] `backend/scripts/` - SQL scripts (review)
- [ ] `backend/alembic/` - Database migrations (KEEP)

### Keep Files
- ✅ `README.md` - Main documentation
- ✅ `start-dev.bat` - Active dev script
- ✅ `start-dev.ps1` - Active dev script
- ✅ `.gitignore` - Git config
- ✅ `backend/pyproject.toml` - Python config
- ✅ `backend/.env` - Environment config
- ✅ `backend/src/` - Production code (KEEP)
- ✅ `backend/tests/` - Test suite (KEEP if has real tests)
- ✅ `frontend/` - Production code (KEEP)

## Execution Plan

1. Review `memory/` directory contents
2. Review `scripts/` directory contents
3. Review `specs/` and `templates/` (decide if still needed)
4. Delete all marked files safely
5. Verify app still works after each deletion batch

