"""
Script to add VIT Pune (Vishwakarma Institute of Technology) and its faculty to the database
Based on Faculty List AY:2025-26
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
    print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# College data
COLLEGE_DATA = {
    "id": "VIT-PUNE-001",
    "name": "Vishwakarma Institute of Technology",
    "city": "Pune",
    "state": "Maharashtra",
    "college_type": "Private Institute",
    "established_year": 1983,
    "website": "https://www.vit.edu",
    "email_domain": "vit.edu"
}

# Faculty list from the PDF screenshots - Department of Information Technology
IT_FACULTY = [
    {"name": "Prof. (Dr.) Sachin Ramrao Sakhare", "designation": "Professor & HOD"},
    {"name": "Dr. Jayashree Vithalrao Bagade", "designation": "Professor"},
    {"name": "Dr. Priyadarshan Shankarrao Dhabe", "designation": "Professor"},
    {"name": "Dr. Preeti Abhitabh Bajlke", "designation": "Associate Professor"},
    {"name": "Dr. Kuldeep Baban Vayadande", "designation": "Associate Professor"},
    {"name": "Dr. Gurunath Thavaru Chavan", "designation": "Associate Professor"},
    {"name": "Dr. Kavita Arjun Sultanpure", "designation": "Associate Professor"},
    {"name": "Mr. Ganesh Chandrabhan Shelke", "designation": "Assistant Professor"},
    {"name": "Mrs. Aparna Rajendra Sawant", "designation": "Assistant Professor"},
    {"name": "Mrs. Deepali Rahul Deshpande", "designation": "Assistant Professor"},
    {"name": "Dr. Deepali Jayant Joshi", "designation": "Assistant Professor"},
    {"name": "Mrs. Ranjana Sukhdev Jadhav", "designation": "Assistant Professor"},
    {"name": "Mr. Pankaj Ramakant Kunekar", "designation": "Assistant Professor"},
    {"name": "Dr. Puja Abhijeet Cholke", "designation": "Assistant Professor"},
    {"name": "Dr. Chaitali Ramesh Shewale", "designation": "Assistant Professor"},
    {"name": "Mr. Mahesh Ashok Bhandari", "designation": "Assistant Professor"},
    {"name": "Mr. Kishor Renukadasrao Pathak", "designation": "Assistant Professor"},
    {"name": "Dr. Deepali Suhas Jadhav", "designation": "Assistant Professor"},
    {"name": "Dr. Devata Raghunath Anekar", "designation": "Assistant Professor"},
    {"name": "Dr. Ganesh Shivaji Pise", "designation": "Assistant Professor"},
    {"name": "Dr. Lomesh Kautik Ahire", "designation": "Assistant Professor"},
    {"name": "Dr. Poonam Yogesh Pawar", "designation": "Assistant Professor"},
    {"name": "Mr. Ganesh Dashrath Jadhav", "designation": "Assistant Professor"},
    {"name": "Mrs. Anuja Rajesh Zade", "designation": "Assistant Professor"},
    {"name": "Mrs. Renuka Sumit Vaidya", "designation": "Assistant Professor"},
    {"name": "Mrs. Supriya Prakash Jagtap", "designation": "Assistant Professor"},
    {"name": "Mr. Mahesh Suhas Shinde", "designation": "Assistant Professor"},
    {"name": "Mrs. Asmita Vishalkumar Patil", "designation": "Assistant Professor"},
    {"name": "Mrs. Pallavi Rhutesh Khalde", "designation": "Assistant Professor"},
    {"name": "Mrs. Shital Mangesh Shirrao", "designation": "Assistant Professor"},
    {"name": "Mr. Prasad Prashant Kharade", "designation": "Assistant Professor"},
    {"name": "Mrs. Ashwini Durvankur Raut", "designation": "Assistant Professor"},
    {"name": "Mrs. Deepali Harshal Gaikwad", "designation": "Assistant Professor"},
    {"name": "Mrs. Snehal Rahul Auti", "designation": "Assistant Professor"},
    {"name": "Mrs. Geeta raju Popalghat", "designation": "Assistant Professor"},
    {"name": "Mrs. Archana Tejraj Deore", "designation": "Assistant Professor"},
    {"name": "Mr. Niranjan Baburao Maharnawar", "designation": "Assistant Professor"},
    {"name": "Mrs. Swati Suresh Udmale", "designation": "Assistant Professor"},
    {"name": "Mrs. Prajakta Pritam Dhole", "designation": "Assistant Professor"},
    {"name": "Mrs. Mayuri Bapusaheb Ghadge", "designation": "Assistant Professor"},
    {"name": "Mr. Saudagar Subhash Burde", "designation": "Assistant Professor"},
    {"name": "Mr. Piyush Anilkumar Sonewar", "designation": "Assistant Professor"},
    {"name": "Mr. Dipak Vitthal Koshti", "designation": "Assistant Professor"},
    {"name": "Mrs. Suvarna Baheti", "designation": "Assistant Professor"},
    {"name": "Mrs. Beena Sanket Sanap", "designation": "Assistant Professor"},
    {"name": "Mr. Rushikesh Sanjiv Tanksale", "designation": "Assistant Professor"},
    {"name": "Mr. Vasanth Kumar Vadivelu", "designation": "Assistant Professor"},
    {"name": "Mrs. Sushama Chandrakant Suryawanshi", "designation": "Assistant Professor"},
    {"name": "Mr. Jitesh Mansukh Sapariya", "designation": "Assistant Professor"},
    {"name": "Mr. Mukesh Govindrao Jadhav", "designation": "Assistant Professor"},
    {"name": "Mr. Avinash Uttamrao Jadhav", "designation": "Assistant Professor"},
]

def add_college():
    """Add VIT Pune college to the database"""
    try:
        print(f"\n📚 Adding college: {COLLEGE_DATA['name']}")
        
        # Check if college already exists
        existing = supabase.table("colleges").select("*").eq("id", COLLEGE_DATA["id"]).execute()
        
        if existing.data:
            print(f"✅ College already exists: {COLLEGE_DATA['name']}")
            return True
        
        # Insert college
        result = supabase.table("colleges").insert(COLLEGE_DATA).execute()
        
        if result.data:
            print(f"✅ Successfully added college: {COLLEGE_DATA['name']}")
            return True
        else:
            print(f"❌ Failed to add college")
            return False
            
    except Exception as e:
        print(f"❌ Error adding college: {str(e)}")
        return False

def add_professors(faculty_list):
    """Add professors to the database"""
    print(f"\n👨‍🏫 Adding {len(faculty_list)} professors...")
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for faculty in faculty_list:
        try:
            # Check if professor already exists
            existing = supabase.table("professors").select("*")\
                .eq("name", faculty["name"])\
                .eq("college_id", COLLEGE_DATA["id"])\
                .execute()
            
            if existing.data:
                print(f"⏭️  Skipped (already exists): {faculty['name']}")
                skip_count += 1
                continue
            
            # Prepare professor data - Use "Not Specified" as department placeholder
            professor_data = {
                "name": faculty["name"],
                "college_id": COLLEGE_DATA["id"],
                "department": "Not Specified",
                "designation": faculty["designation"],
                "is_verified": False
            }
            
            # Insert professor
            result = supabase.table("professors").insert(professor_data).execute()
            
            if result.data:
                print(f"✅ Added: {faculty['name']} ({faculty['designation']})")
                success_count += 1
            else:
                print(f"❌ Failed to add: {faculty['name']}")
                error_count += 1
                
        except Exception as e:
            print(f"❌ Error adding {faculty['name']}: {str(e)}")
            error_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Successfully added: {success_count}")
    print(f"   ⏭️  Skipped (existing): {skip_count}")
    print(f"   ❌ Errors: {error_count}")
    
    return success_count > 0

def main():
    """Main function to add college and all professors"""
    print("=" * 60)
    print("VIT Pune Faculty Import Script")
    print("Faculty List AY:2025-26")
    print("=" * 60)
    
    # Step 1: Add college
    if not add_college():
        print("\n❌ Failed to add college. Exiting.")
        sys.exit(1)
    
    # Step 2: Add all IT department professors (without department field)
    add_professors(IT_FACULTY)
    
    print("\n" + "=" * 60)
    print("✨ Import completed!")
    print("=" * 60)
    print(f"\n🎓 College: {COLLEGE_DATA['name']}")
    print(f"📍 Location: {COLLEGE_DATA['city']}, {COLLEGE_DATA['state']}")
    print(f"👥 Total Faculty Added: {len(IT_FACULTY)}")
    print(f"📝 Note: Department field left empty (not specified in source)")
    print(f"\n🔗 View college at: /colleges/{COLLEGE_DATA['id']}")
    print("=" * 60)

if __name__ == "__main__":
    main()
