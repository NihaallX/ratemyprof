# Adding MIT WPU to Database

This guide explains how to add MIT World Peace University (MIT WPU) and its faculty to the RateMyProf database.

## Overview

We've created two approaches to add MIT WPU faculty data:

1. **Automated Web Scraping** (Recommended first try)
2. **Manual Data Entry** (Fallback if scraping doesn't work)

## Prerequisites

Install the required packages:

```powershell
cd backend
pip install beautifulsoup4 requests selenium
```

Or install from requirements.txt:

```powershell
pip install -r requirements.txt
```

## Method 1: Automated Web Scraping

### Step 1: Run the Scraper

```powershell
cd backend
python scripts/scrape_mitwpu_faculty.py
```

### What it does:
- ✅ Fetches faculty data from https://mitwpu.edu.in/faculty/teaching
- ✅ Creates MIT WPU college entry in database
- ✅ Extracts professor names, departments, designations, and emails
- ✅ Adds professors to the database
- ✅ Skips duplicates automatically

### Possible Issues:
The MIT WPU website may:
- Use JavaScript to load content dynamically
- Block automated requests
- Have a structure that requires custom parsing

If scraping fails, proceed to Method 2.

## Method 2: Manual Data Entry

### Step 1: Collect Faculty Data

1. Visit https://mitwpu.edu.in/faculty/teaching
2. Manually collect faculty information:
   - Name
   - Department
   - Designation (Professor, Associate Professor, etc.)
   - Email (if available)
   - Specializations (optional)

### Step 2: Update the Script

Edit `backend/scripts/add_mitwpu_manual.py` and update the `FACULTY_DATA` list:

```python
FACULTY_DATA = [
    {
        "name": "Dr. John Doe",
        "department": "Computer Science",
        "designation": "Professor",
        "email": "john.doe@mitwpu.edu.in",
        "specializations": "AI, Machine Learning"
    },
    {
        "name": "Dr. Jane Smith",
        "department": "Mechanical Engineering",
        "designation": "Associate Professor",
        "email": "jane.smith@mitwpu.edu.in"
    },
    # Add more faculty members here
]
```

### Step 3: Run the Script

```powershell
cd backend
python scripts/add_mitwpu_manual.py
```

## College Information

The scripts will create MIT WPU with the following details:

- **ID**: MITWPU-PUNE-001
- **Name**: MIT World Peace University
- **Short Name**: MIT WPU
- **City**: Pune
- **State**: Maharashtra
- **Website**: https://mitwpu.edu.in
- **Email Domain**: mitwpu.edu.in
- **Established**: 2002
- **Type**: University
- **Verified**: True

## Verification

After running either script:

1. Professors will be added with `is_verified=False` initially
2. Admin needs to review and verify each professor
3. Check the database to confirm entries:

```powershell
# In your backend directory
python check_db_state.py
```

## Database Schema

### College Entry
```sql
INSERT INTO colleges (
    id, name, short_name, city, state, 
    website, email_domain, college_type, is_verified
) VALUES (
    'MITWPU-PUNE-001', 'MIT World Peace University', 'MIT WPU',
    'Pune', 'Maharashtra', 'https://mitwpu.edu.in',
    'mitwpu.edu.in', 'University', true
);
```

### Professor Entries
```sql
INSERT INTO professors (
    id, name, email, department, designation,
    college_id, is_verified, is_active
) VALUES (
    uuid, 'Dr. Name', 'email@mitwpu.edu.in', 'Department',
    'Professor', 'MITWPU-PUNE-001', false, true
);
```

## Next Steps

After adding MIT WPU:

1. **Admin Verification**: Review and verify all added professors
2. **Frontend Update**: MIT WPU should automatically appear in college search
3. **Test**: Try searching for MIT WPU and its professors
4. **Enable Reviews**: Students can now add reviews for MIT WPU professors

## Troubleshooting

### Scraper Not Working?
- Check if the website structure has changed
- Try running with Selenium (update `USE_SELENIUM = True` in scraper)
- Use manual entry method

### Database Connection Issues?
- Verify your `.env` file has correct `DATABASE_URL`
- Check if database is accessible
- Ensure you're in the backend directory

### Duplicates?
- Scripts automatically skip existing professors
- Use professor name + college_id as unique identifier

## Support

For issues or questions:
- Check the console output for detailed error messages
- Review the database state with `check_db_state.py`
- Update parsing logic if website structure changed
