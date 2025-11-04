-- Create site_settings table for global configuration
-- This table stores key-value pairs for site-wide settings like maintenance mode

CREATE TABLE IF NOT EXISTS site_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_setting_key CHECK (setting_key IN ('maintenance_mode'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Insert default maintenance mode setting (disabled by default)
INSERT INTO site_settings (setting_key, setting_value, updated_at, updated_by)
VALUES ('maintenance_mode', false, NOW(), 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings (public)
CREATE POLICY "site_settings_read_policy"
    ON site_settings
    FOR SELECT
    USING (true);

-- Policy: No one can insert/update/delete directly (only through API with admin auth)
CREATE POLICY "site_settings_admin_only"
    ON site_settings
    FOR ALL
    USING (false);

-- Grant permissions
GRANT SELECT ON site_settings TO anon, authenticated;
GRANT ALL ON site_settings TO service_role;

-- Add comment
COMMENT ON TABLE site_settings IS 'Global site configuration settings like maintenance mode';
COMMENT ON COLUMN site_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN site_settings.setting_value IS 'Boolean value of the setting';
COMMENT ON COLUMN site_settings.updated_at IS 'Timestamp of last update';
COMMENT ON COLUMN site_settings.updated_by IS 'Admin username who made the update';
