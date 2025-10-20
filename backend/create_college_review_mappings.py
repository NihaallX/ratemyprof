"""
Create college_review_author_mappings table in Supabase.
This table links college reviews to authors for privacy-preserving review tracking.
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment")

# Create Supabase admin client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def create_college_review_mappings_table():
    """Create the college_review_author_mappings table using SQL."""
    
    sql = """
    -- Create college_review_author_mappings table
    CREATE TABLE IF NOT EXISTS college_review_author_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure one author per review
        UNIQUE(review_id),
        
        -- Index for fast author lookups
        CONSTRAINT unique_author_per_review UNIQUE(review_id)
    );

    -- Create index for finding reviews by author
    CREATE INDEX IF NOT EXISTS idx_college_review_author_mappings_author_id 
    ON college_review_author_mappings(author_id);

    -- Create index for finding author by review
    CREATE INDEX IF NOT EXISTS idx_college_review_author_mappings_review_id 
    ON college_review_author_mappings(review_id);

    -- Enable Row Level Security
    ALTER TABLE college_review_author_mappings ENABLE ROW LEVEL SECURITY;

    -- RLS Policy: Service role can do anything
    DROP POLICY IF EXISTS "Service role can manage college review mappings" ON college_review_author_mappings;
    CREATE POLICY "Service role can manage college review mappings"
    ON college_review_author_mappings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

    -- RLS Policy: Users can only see their own mappings (for "My Reviews" page)
    DROP POLICY IF EXISTS "Users can view own college review mappings" ON college_review_author_mappings;
    CREATE POLICY "Users can view own college review mappings"
    ON college_review_author_mappings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = author_id);
    """
    
    print("Creating college_review_author_mappings table...")
    
    try:
        # Execute SQL using Supabase RPC or direct SQL execution
        result = supabase.rpc('exec_sql', {'query': sql}).execute()
        print("✅ Table created successfully!")
        return True
    except Exception as e:
        # If RPC doesn't work, print SQL for manual execution
        print(f"⚠️  Could not create table automatically: {str(e)}")
        print("\n" + "="*80)
        print("Please run this SQL in your Supabase SQL Editor:")
        print("="*80)
        print(sql)
        print("="*80)
        return False

if __name__ == '__main__':
    print("Setting up college_review_author_mappings table...")
    print(f"Supabase URL: {SUPABASE_URL}")
    
    success = create_college_review_mappings_table()
    
    if success:
        print("\n✅ All done! The table is ready to use.")
    else:
        print("\n⚠️  Please run the SQL manually in Supabase SQL Editor.")
