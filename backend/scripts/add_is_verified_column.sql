-- Add is_verified column to professors table
-- This column controls whether professors appear in search results
-- New professors start as unverified and need admin approval

ALTER TABLE professors 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_professors_is_verified ON professors(is_verified);

-- Update existing professors to be verified by default
-- (assuming existing data should be visible)
UPDATE professors SET is_verified = TRUE WHERE is_verified IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN professors.is_verified IS 'Whether the professor profile has been verified by admin and should appear in search results';