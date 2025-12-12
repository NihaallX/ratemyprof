# MIT WPU Faculty Addition - Quick Guide

## The Situation

The MIT WPU website (https://mitwpu.edu.in/faculty/teaching) uses JavaScript to dynamically load faculty data via AJAX calls. This means simple web scraping won't work - the data isn't in the initial HTML.

## ✅ Recommended Approach: Manual Data Entry

Since automated scraping requires complex browser automation (Selenium), **I recommend using the manual entry method** for now. Here's how:

### Step 1: Collect Faculty Data from Website

Visit https://mitwpu.edu.in/faculty/teaching and manually collect:
- Faculty names
- Departments
- Designations
- Emails (if available)

You can filter by school/department using the dropdowns on the page.

### Step 2: Update the Script

Edit `backend\scripts\add_mitwpu_manual.py` and add faculty data:

```python
FACULTY_DATA = [
    {
        "name": "Dr. Rajesh Kumar",
        "department": "Computer Science",
        "designation": "Professor",
        "email": "rajesh.kumar@mitwpu.edu.in"
    },
    {
        "name": "Dr. Priya Sharma",
        "department": "Mechanical Engineering",
        "designation": "Associate Professor",
        "email": "priya.sharma@mitwpu.edu.in"
    },
    # Add more faculty members...
]
```

### Step 3: Run the Script

```powershell
# Make sure you're in the project root directory
C:/Python313/python.exe backend\scripts\add_mitwpu_manual.py
```

The script will:
1. ✅ Create MIT WPU college entry (if it doesn't exist)
2. ✅ Add all faculty members to the database
3. ✅ Skip duplicates automatically
4. ✅ Set professors as unverified for admin review

### Step 4: Verify in Database

After running, you can check the database to confirm the entries were added.

## 🔄 Alternative: Selenium-Based Scraping (Advanced)

If you want to automate the scraping, we would need to:

1. Install Selenium and a web driver (Chrome/Firefox)
2. Create a script that:
   - Opens the page in a browser
   - Waits for JavaScript to load
   - Clicks through pagination
   - Extracts faculty data from rendered HTML

This is more complex but doable if needed.

## 📊 Quick Start

To get started quickly:

1. Open https://mitwpu.edu.in/faculty/teaching in your browser
2. Use the filters to select each school
3. Copy faculty names and details
4. Add to `FACULTY_DATA` in `add_mitwpu_manual.py`
5. Run the script

## Need Help?

- The manual entry script is at: `backend\scripts\add_mitwpu_manual.py`
- Full documentation is at: `docs\MIT_WPU_ADDITION.md`
- Required packages are already added to `requirements.txt`

## College Details

The college will be created with ID: `MITWPU-PUNE-001`
- Name: MIT World Peace University
- City: Pune
- State: Maharashtra
- Verified: Yes

All professors will be added with `is_verified=False` for admin review.
