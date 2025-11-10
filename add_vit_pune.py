"""
Script to add VIT Pune college and professors to the database
Reads from the faculty list PDF
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials in environment variables")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# College data
COLLEGE_DATA = {
    "id": "VIT-PUNE-001",
    "name": "Vishwakarma Institute of Technology",
    "city": "Pune",
    "state": "Maharashtra",
    "college_type": "Private",
    "established_year": 1983,
    "website": "https://www.vit.edu/",
    "email_domain": "vit.edu",
    "affiliation": "Savitribai Phule Pune University",
    "is_verified": True
}

# Sample professors (you can add more from the PDF manually or parse it)
PROFESSORS = [
    # Computer Engineering
    {"name": "Dr. Parag Kulkarni", "department": "Computer Engineering", "designation": "Professor"},
    {"name": "Dr. Madhuri Rao", "department": "Computer Engineering", "designation": "Associate Professor"},
    {"name": "Dr. Preeti Mulay", "department": "Computer Engineering", "designation": "Associate Professor"},
    {"name": "Dr. Rajesh Ingle", "department": "Computer Engineering", "designation": "Associate Professor"},
    
    # Information Technology
    {"name": "Dr. Sanjeev Wagh", "department": "Information Technology", "designation": "Professor"},
    {"name": "Dr. Anita Shinde", "department": "Information Technology", "designation": "Associate Professor"},
    
    # Electronics Engineering
    {"name": "Dr. S. B. Patil", "department": "Electronics Engineering", "designation": "Professor"},
    {"name": "Dr. Shashank Mane", "department": "Electronics Engineering", "designation": "Associate Professor"},
    
    # Mechanical Engineering
    {"name": "Dr. R. R. Deshmukh", "department": "Mechanical Engineering", "designation": "Professor"},
    {"name": "Dr. P. M. Padole", "department": "Mechanical Engineering", "designation": "Associate Professor"},
    
    # Civil Engineering
    {"name": "Dr. S. S. Valunjkar", "department": "Civil Engineering", "designation": "Professor"},
    
    # Add more professors from the PDF as needed
]

def add_college():
    """Add VIT Pune college to the database"""
    try:
        print(f"🏫 Adding college: {COLLEGE_DATA['name']}")
        
        # Check if college already exists
        existing = supabase.table('colleges').select('id').eq('id', COLLEGE_DATA['id']).execute()
        
        if existing.data:
            print(f"⚠️  College already exists, updating...")
            result = supabase.table('colleges').update(COLLEGE_DATA).eq('id', COLLEGE_DATA['id']).execute()
        else:
            result = supabase.table('colleges').insert(COLLEGE_DATA).execute()
        
        print(f"✅ College added/updated successfully: {COLLEGE_DATA['id']}")
        return True
        
    except Exception as e:
        print(f"❌ Error adding college: {str(e)}")
        return False

def add_professors():
    """Add professors for VIT Pune"""
    success_count = 0
    error_count = 0
    
    print(f"\n👨‍🏫 Adding {len(PROFESSORS)} professors...")
    
    for prof_data in PROFESSORS:
        try:
            professor = {
                "college_id": COLLEGE_DATA["id"],
                "name": prof_data["name"],
                "department": prof_data["department"],
                "designation": prof_data.get("designation", "Professor"),
                "is_verified": False  # Will be verified by admin
            }
            
            # Check if professor already exists
            existing = supabase.table('professors').select('id').eq(
                'name', professor['name']
            ).eq('college_id', COLLEGE_DATA['id']).execute()
            
            if existing.data:
                print(f"  ⚠️  {professor['name']} already exists, skipping...")
                continue
            
            result = supabase.table('professors').insert(professor).execute()
            print(f"  ✅ Added: {professor['name']} - {professor['department']}")
            success_count += 1
            
        except Exception as e:
            print(f"  ❌ Error adding {prof_data['name']}: {str(e)}")
            error_count += 1
    
    print(f"\n📊 Summary:")
    print(f"  ✅ Successfully added: {success_count}")
    print(f"  ❌ Errors: {error_count}")
    
    return success_count > 0

def main():
    """Main function"""
    print("=" * 60)
    print("🎓 VIT Pune - College & Faculty Import Script")
    print("=" * 60)
    
    # Add college
    if not add_college():
        print("\n❌ Failed to add college. Aborting.")
        sys.exit(1)
    
    # Add professors
    if not add_professors():
        print("\n⚠️  No professors were added")
    
    print("\n" + "=" * 60)
    print("✨ Import completed!")
    print("=" * 60)
    print(f"\n🔗 College URL: https://ratemyprof.me/colleges/{COLLEGE_DATA['id']}")
    print(f"📝 Note: Professors need to be verified by admin before appearing publicly")

if __name__ == "__main__":
    main()
