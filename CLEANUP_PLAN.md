# Project Cleanup Plan

## ✅ SAFE TO DELETE - Root Directory

- [ ] `favicon.svg` - unused favicon file
- [ ] `favicon.png` - unused favicon file
- [ ] `favicon_io.zip` - unused favicon file

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
- [ ] `RESCRAPE_GUIDE.md` - Department update guide (one-time task, complete)
- [ ] `QUICK_FIX_DEPARTMENTS.md` - Department fix guide (one-time task, complete)

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
- [ ] `check_prof_count.py` - One-time diagnostic we created
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
- [ ] `check_mapping_table.py` - One-time diagnostic we created
- [ ] `check_review_id.py` - One-time diagnostic we created

### One-Time Fix Scripts
- [ ] `cleanup_orphaned_reviews.py` - One-time cleanup we ran
- [ ] `find_orphaned_reviews.py` - Diagnostic script we created
- [ ] `fix_duplicate_ids.py` - One-time fix
- [ ] `fix_duplicate_professors.py` - One-time fix
- [ ] `fix_duplicate_professors_corrected.py` - One-time fix
- [ ] `fix_orphaned_reviews.py` - One-time fix we ran
- [ ] `create_college_review_mappings.py` - One-time setup we ran
- [ ] `fix_unknown_departments.py` - One-time department fix we ran

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
- [ ] `test_review_flow.py` - One-time test we created
- [ ] `test_review_submit.py` - One-time test we created
- [ ] `verify_ml_tools.py` - Old verification script

### Test Cache
- [ ] `pytest-cache-files-lo2_crq6/` - Old pytest cache
- [ ] `.pytest_cache/` - Pytest cache

### Professor Department Update Scripts (One-Time Use)
- [ ] `backend/scripts/scrape_vu_professors.py` - Empty file, never used
- [ ] `backend/scripts/scrape_vu_professors_v2.py` - Scraper attempt #1 (superseded)
- [ ] `backend/scripts/scrape_vu_selenium.py` - Selenium scraper (requires extra dependencies)
- [ ] `backend/scripts/update_professor_departments.py` - Manual mapping script (superseded)
- [ ] `backend/scripts/update_departments_from_csv.py` - CSV method (superseded by final version)
- [ ] `backend/scripts/interactive_dept_update.py` - Interactive updater (superseded)
- [ ] `backend/scripts/check_professor_departments.py` - One-time check script
- [ ] `backend/scripts/fix_departments_simple.py` - Simple CSV updater (superseded)
- [ ] `backend/scripts/auto_update_departments.py` - Auto updater v1 (superseded)
- [ ] `backend/scripts/smart_dept_scraper.py` - Smart scraper v2 (superseded)
- [ ] `backend/scripts/auto_update_final.py` - Partial auto updater (superseded)
- [ ] `backend/scripts/scraped_professors.json` - Temp scrape output (can delete)
- [ ] `backend/scripts/scraped_professors_selenium.json` - Temp scrape output (can delete)
- [ ] `backend/scripts/scraped_faculty.json` - Temp scrape output (can delete)
- [ ] `backend/scripts/professors_departments.csv` - Temp CSV export (can delete after backup)
- ✅ `backend/scripts/complete_dept_update.py` - **KEEP** - Final working updater (may need again)

### CSV Data Files (Temporary)
- [ ] `backend/department_updates.csv` - One-time update data (completed)

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

## 📋 Cleanup Summary

### Total Files to Review for Deletion
- **Root Directory**: ~15 old documentation files + 10 old scripts + 3 test files
- **Backend Directory**: ~15 diagnostic scripts + 8 fix scripts + 11 department update scripts + 6 test files + 4 temp data files
- **Test Cache**: 4 cache directories

**Estimated Space Savings**: ~5-10 MB of outdated scripts and documentation

## ⚠️ Important Notes

### Do NOT Delete
- `backend/scripts/complete_dept_update.py` - Keep in case department updates needed again
- `RAILWAY_SETUP.md` - Keep for deployment reference
- `DEPLOYMENT_INSTRUCTIONS.md` - Keep for deployment reference
- `QUICK_REFERENCE.md` - Keep for daily development
- `ADMIN_PANEL_FIXES.md` - Keep for admin panel reference
- Any files in `backend/src/` - Production code
- Any files in `frontend/src/` - Production code

### Backup Before Deleting
- `backend/scripts/professors_departments.csv` - Contains professor-department mappings
- `department_updates.csv` - Contains update history

## Execution Plan

1. **Backup Important CSVs** to a safe location outside the repo
2. Review `memory/` directory contents
3. Review `scripts/` directory contents  
4. Review `specs/` and `templates/` (decide if still needed)
5. **Delete in batches**:
   - Batch 1: Test cache directories
   - Batch 2: Old documentation files
   - Batch 3: Diagnostic scripts
   - Batch 4: One-time fix scripts
   - Batch 5: Department update scripts (keep complete_dept_update.py)
   - Batch 6: Temporary data files (after backup)
6. **Test after each batch**: Verify website still works
7. **Git commit** after each successful batch deletion

### Quick Cleanup Commands

```powershell
# Navigate to project root
cd D:\ClgStuff\ratemyprof

# Delete test caches (safe)
Remove-Item -Recurse -Force .pytest_cache, pytest-cache-files-g95zw9xo

# Delete backend test caches (safe)
cd backend
Remove-Item -Recurse -Force .pytest_cache, pytest-cache-files-lo2_crq6

# Delete temp JSON files (safe, already used)
cd scripts
Remove-Item scraped_*.json

# After backing up CSVs, delete them
# Remove-Item professors_departments.csv, department_updates.csv
```

### Manual Review Needed
- Check if `specs/` is still referenced anywhere
- Check if `templates/` is still used
- Review `memory/` for any critical notes
- Verify no other scripts reference the files marked for deletion

