-- ===================================================================
-- ADD MODERATION COLUMNS TO REVIEWS TABLE
-- ===================================================================
-- These columns track who moderated a review and when
-- ===================================================================

-- Add moderation tracking columns
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_moderated_at ON reviews(moderated_at);
CREATE INDEX IF NOT EXISTS idx_reviews_moderated_by ON reviews(moderated_by);

-- Add comments
COMMENT ON COLUMN reviews.moderated_at IS 'Timestamp when review was moderated by admin';
COMMENT ON COLUMN reviews.moderated_by IS 'Admin user who performed moderation action';

-- Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    '✅ Column added' as status
FROM information_schema.columns
WHERE table_name = 'reviews' 
    AND column_name IN ('moderated_at', 'moderated_by', 'status')
ORDER BY column_name;
