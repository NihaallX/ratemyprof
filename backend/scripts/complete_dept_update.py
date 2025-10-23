"""
Complete VU Pune Department Auto-Assignment
Scrapes the entire faculty list with departments and updates ALL professors
"""

import os
import sys
from pathlib import Path
import re

sys.path.append(str(Path(__file__).parent.parent))

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

BASE_URL = "https://www.vupune.ac.in/our-team"

def clean_name(name: str) -> str:
    """Clean professor name for matching"""
    name = ' '.join(name.split())
    # Remove titles
    for title in ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', '(Dr.)', '(Mrs.)', '(Mr.)']:
        name = name.replace(title, '')
    return name.strip()

def fuzzy_match(name1: str, name2: str) -> bool:
    """Check if two names match"""
    n1 = clean_name(name1).lower()
    n2 = clean_name(name2).lower()
    
    if n1 == n2:
        return True
    if n1 in n2 or n2 in n1:
        return True
    
    # Check last name
    parts1 = n1.split()
    parts2 = n2.split()
    if parts1 and parts2:
        if parts1[-1] == parts2[-1] and len(parts1[-1]) > 3:
            # Also check first name initial
            if parts1[0][0] == parts2[0][0]:
                return True
    
    return False

def get_college_id():
    """Get Vishwakarma University ID"""
    result = supabase.table('colleges').select('id').eq('name', 'Vishwakarma University').execute()
    if result.data:
        return result.data[0]['id']
    return None

def scrape_complete_faculty_list():
    """Scrape complete faculty list with departments from VU Pune website"""
    print("\n" + "="*80)
    print("🔍 SCRAPING COMPLETE FACULTY LIST FROM VU PUNE")
    print("="*80)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    faculty_mapping = {}
    
    try:
        response = requests.get(BASE_URL, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        print("\n📄 Analyzing page structure...")
        
        # The VU Pune website structure:
        # Department headers followed by faculty members
        
        # Strategy: Find all text on the page and identify patterns
        page_text = soup.get_text()
        lines = [line.strip() for line in page_text.split('\n') if line.strip()]
        
        current_dept = None
        dept_keywords = ['Department of', 'Dept of', 'Faculty of']
        
        for i, line in enumerate(lines):
            # Check if this line is a department header
            is_dept = any(keyword in line for keyword in dept_keywords)
            
            if is_dept and len(line) < 100:  # Department names are short
                # Normalize department name
                current_dept = line
                for keyword in dept_keywords:
                    if keyword in current_dept:
                        current_dept = 'Department of ' + current_dept.split(keyword)[1].strip()
                        break
                
                # Clean up department name
                current_dept = re.sub(r'\s+', ' ', current_dept)
                print(f"\n📂 Found: {current_dept}")
                continue
            
            # Check if this line looks like a professor name
            if current_dept and any(title in line for title in ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']):
                # Make sure it's not too long (names are usually short)
                if len(line) < 100 and not any(skip in line.lower() for skip in ['department', 'faculty', 'dean', 'director', 'hod', 'controller']):
                    cleaned = clean_name(line)
                    if len(cleaned) > 5:  # Valid name length
                        faculty_mapping[line] = current_dept
                        print(f"   ✓ {line}")
        
        # Additional scraping: Look for structured faculty cards
        faculty_cards = soup.find_all(['div', 'article'], class_=re.compile(r'team|faculty|member|person', re.I))
        
        for card in faculty_cards:
            name_elem = card.find(['h5', 'h4', 'h3', 'h2'])
            if name_elem:
                name = name_elem.get_text(strip=True)
                if any(title in name for title in ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']):
                    # Try to find department from nearby text
                    dept_elem = card.find(['p', 'span', 'div'], string=re.compile(r'Department|Dept|Faculty', re.I))
                    if dept_elem:
                        dept_text = dept_elem.get_text(strip=True)
                        dept_text = 'Department of ' + re.sub(r'.*(Department of|Dept of|Faculty of)\s*', '', dept_text, flags=re.IGNORECASE)
                        if name not in faculty_mapping:
                            faculty_mapping[name] = dept_text
        
        print(f"\n✅ Total faculty found: {len(faculty_mapping)}")
        return faculty_mapping
        
    except Exception as e:
        print(f"❌ Error scraping: {e}")
        import traceback
        traceback.print_exc()
        return {}

def create_comprehensive_mapping():
    """Create comprehensive mapping including all known professors"""
    
    # Combine scraped data with manual additions for hard-to-scrape professors
    comprehensive_mapping = {
        # Engineering (from website departments)
        'Nitin Satpute': 'Department of Engineering',
        'Wasudeo Gade': 'Department of Engineering',
        'Subhash Pawar': 'Department of Engineering',
        'Alka Khade': 'Department of Engineering',
        
        # Computer Science & IT
        'Vivek Vishnu Datar': 'Department of Computer Science',
        'Sandip Kulkarni': 'Department of Computer Science',
        'Supriya Ashok Bhosale': 'Department of Computer Applications',
        
        # Humanities continuing
        'Rukmani Mahala': 'Department of Humanities and Social Sciences',
        'Dolly Rawat': 'Department of Humanities and Social Sciences',
        'Debasmita Sen': 'Department of Humanities and Social Sciences',
        'Madhuri Marathe': 'Department of Humanities and Social Sciences',
        'Kavita Suresh Kumavat': 'Department of Humanities and Social Sciences',
        'Kalyani Kadam': 'Department of Humanities and Social Sciences',
        
        # Architecture
        'Kaustubh Utpat': 'Department of Architecture',
        'Rahul Honrao': 'Department of Architecture',
        'Hema Wadikar': 'Department of Architecture',
        
        # Art & Design
        'Prabuddh Ganguly': 'Department of Art and Design',
        'Prashant Aacharya': 'Department of Art and Design',
        'Shivani Arvind Sawant': 'Department of Art and Design',
        'Disha Rajesh Budage': 'Department of Art and Design',
        'Prajakta Rokade': 'Department of Art and Design',
        'Deepak Ramesh Giri': 'Department of Art and Design',
        'Anand Shatrughna Pratap': 'Department of Art and Design',
        'Vaishali Wagh': 'Department of Art and Design',
        
        # Travel & Tourism
        'Prachiti Suryawanshi': 'Department of Travel and Tourism',
        'Yogesh Suryawanshi': 'Department of Travel and Tourism',
        'Arun Bhagwan Suryawanshi': 'Department of Travel and Tourism',
        'Nazia Wahid': 'Department of Travel and Tourism',
        
        # Commerce & Management continuing
        'Mrunmai Ranade': 'Department of Commerce and Management',
        'Yogita Patil': 'Department of Commerce and Management',
        'Pratibha Mahajan': 'Department of Commerce and Management',
        'Subodh Kharat': 'Department of Commerce and Management',
        'Vijaya Hake': 'Department of Commerce and Management',
        'Yogesh Desale': 'Department of Commerce and Management',
        'Vaishali Deepak Sahoo': 'Department of Commerce and Management',
        'Sweety Siddharth Thakkar': 'Department of Commerce and Management',
        'Khushbu N.Kadukar': 'Department of Commerce and Management',
        'Samad Khan': 'Department of Commerce and Management',
        'Gajanan Achutrao Deshmukh': 'Department of Commerce and Management',
        'Anjali Ambadas Landge': 'Department of Commerce and Management',
        'Santosh Bhauso Takale': 'Department of Commerce and Management',
        'Rupali Dineshwar Taware': 'Department of Commerce and Management',
        
        # Law
        'Sarika Sagar': 'Department of Law',
        'Sukanya Mukund Kulkarni': 'Department of Law',
        'Unmesha Patil': 'Department of Law',
        'Divyanshu Priyadarshi': 'Department of Law',
        'Shruti Das': 'Department of Law',
        'Manu Joseph G': 'Department of Law',
        
        # Media & Communication
        'Shekhar Paigude': 'Department of Media and Communication',
        'Angad Pralhad Taur': 'Department of Media and Communication',
        'Ravi Dnyandeo Nikam': 'Department of Media and Communication',
        'Rahul Mate': 'Department of Media and Communication',
        'Ujjaini Chakrabarty': 'Department of Media and Communication',
        
        # Pharmacy continuing
        'Sonali Manwatkar': 'Department of Pharmacy',
        'Lida Sajimon': 'Department of Pharmacy',
        'Supriya Ashutosh Unavane': 'Department of Pharmacy',
        'Bhavna Sunil Mahajan': 'Department of Pharmacy',
        'Jisha Joseph': 'Department of Pharmacy',
        'Snehal Tukaram Hase': 'Department of Pharmacy',
        'Poonam Popatrao Taru': 'Department of Pharmacy',
        'Yogita Akash Shinde': 'Department of Pharmacy',
        'Prajakta Deepak Kapadnis': 'Department of Pharmacy',
        'Vishnu Parab': 'Department of Pharmacy',
        'Archana Pramod Shaha': 'Department of Pharmacy',
        'Kirti Vitthalrao Deshpande': 'Department of Pharmacy',
        'Pallavi Gaurav Kale': 'Department of Pharmacy',
        'Shital Digambar Godse': 'Department of Pharmacy',
        'Uppu Srinivas': 'Department of Pharmacy',
        'Vijay Khedkar': 'Department of Pharmacy',
        'Jupinder Kaur': 'Department of Pharmacy',
        'Prajakta Ganesh Dhamdhere': 'Department of Pharmacy',
        'Chaitrali D. Dhole': 'Department of Pharmacy',
        'Nikita Kulkarni': 'Department of Pharmacy',
        'Snehal Shinde': 'Department of Pharmacy',
        'Sonali Kedar Powar': 'Department of Pharmacy',
        
        # Science & Others
        'Mahfooz Alam': 'Department of Science',
        'Aachal Taywade': 'Department of Science',
        'Swati Shriyal': 'Department of Science',
        'Bharati Ainapure': 'Department of Science',
        'Mayur Prakashrao Deshmukh': 'Department of Science',
        'Madhuri Prashant Pant': 'Department of Science',
        
        # Administration/Support
        'Prasad Sharadrao Chande': 'Administration',
        'Kinjawadekar Rushika': 'Administration',
        'Adtiya Bhope': 'Administration',
        'Shriprada Shrimant Chaturbhuj': 'Administration',
        'Anupriya Kamble': 'Administration',
        
        # Additional faculty
        'Savita Prashant Vibhute': 'Department of Science',
        'Trupti Smit Shinde': 'Department of Science',
        'Seema Sachin Vanjire': 'Department of Commerce and Management',
        'Aarti Surshbhai Sardhara': 'Department of Commerce and Management',
        'Suhas Chavan': 'Department of Engineering',
        'Kanchan Jayesh Katake': 'Department of Engineering',
        'Rahul Rajendra Papalkar': 'Department of Engineering',
        'Harish Motekar': 'Department of Engineering',
        'Ashwini Sanjay Sengar': 'Department of Engineering',
        'Vaishali Sharad Meshram': 'Department of Engineering',
        'Sujit Nishikant Deshpande': 'Department of Engineering',
        'Chetan Chauhan': 'Leadership',
        'Saba Anjum Jahangir Patel': 'Department of Law',
        'Vikas Sitaram Katakdound': 'Department of Engineering',
        'Sonali Appasaheb Patil': 'Department of Pharmacy',
        'Kedar Sant': 'Department of Music',
        'Noshir Zal Tarapore': 'Department of Architecture',
        'Madhavi Dachawar': 'Department of Commerce and Management',
        'Tareek Manohar Pattewar': 'Department of Engineering',
    }
    
    return comprehensive_mapping

def update_all_professors():
    """Update ALL professors with departments"""
    print("\n" + "="*80)
    print("🚀 UPDATING ALL PROFESSORS WITH DEPARTMENTS")
    print("="*80)
    
    college_id = get_college_id()
    if not college_id:
        print("❌ College not found!")
        return
    
    # Get comprehensive mapping
    print("\n📋 Loading comprehensive department mappings...")
    manual_mapping = create_comprehensive_mapping()
    
    # Try to scrape additional data
    print("\n🌐 Attempting to scrape additional data from website...")
    scraped_mapping = scrape_complete_faculty_list()
    
    # Combine mappings (manual takes precedence)
    combined_mapping = {**scraped_mapping, **manual_mapping}
    
    print(f"\n📊 Total mappings available: {len(combined_mapping)}")
    
    # Get all professors with Unknown department
    result = supabase.table('professors').select('*').eq('college_id', college_id).eq('department', 'Unknown').execute()
    unknown_profs = result.data
    
    print(f"📊 Professors to update: {len(unknown_profs)}\n")
    
    updated = 0
    not_found = []
    
    for prof in unknown_profs:
        db_name = prof.get('name', '')
        if not db_name:
            continue
        
        # Try to find a match
        matched_dept = None
        for mapped_name, department in combined_mapping.items():
            if fuzzy_match(db_name, mapped_name):
                matched_dept = department
                break
        
        if matched_dept:
            try:
                supabase.table('professors').update({
                    'department': matched_dept
                }).eq('id', prof['id']).execute()
                
                print(f"   ✅ {db_name:45} → {matched_dept}")
                updated += 1
            except Exception as e:
                print(f"   ❌ Error updating {db_name}: {e}")
        else:
            not_found.append(db_name)
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"✅ Updated: {updated}")
    print(f"⚠️  Not found: {len(not_found)}")
    print(f"📝 Total processed: {len(unknown_profs)}")
    
    if not_found:
        print(f"\n⚠️  Professors still without departments ({len(not_found)}):")
        for name in not_found[:20]:  # Show first 20
            print(f"   - {name}")
        if len(not_found) > 20:
            print(f"   ... and {len(not_found) - 20} more")
    
    print("="*80)

def main():
    print("\n" + "="*80)
    print("🎓 COMPLETE VU PUNE DEPARTMENT AUTO-ASSIGNMENT")
    print("="*80)
    print("\nThis will update ALL remaining professors with their departments")
    print("using comprehensive mappings and web scraping.")
    
    response = input("\n✅ Proceed with complete update? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("❌ Cancelled")
        return
    
    update_all_professors()
    
    print("\n💡 Check results on your website: https://ratemyprof.me")
    print("   Run this script again if you add more professors!")

if __name__ == "__main__":
    main()
