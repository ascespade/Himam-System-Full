-- Migration: Create WhatsApp settings table for dynamic configuration
-- This allows managing WhatsApp settings from database instead of environment variables

CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verify_token VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  phone_number_id VARCHAR(50) NOT NULL,
  webhook_url TEXT,
  n8n_webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active settings
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_active ON whatsapp_settings(is_active) WHERE is_active = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_settings_updated_at 
  BEFORE UPDATE ON whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_settings_updated_at();

-- Function to ensure only one active setting
CREATE OR REPLACE FUNCTION ensure_single_active_whatsapp_setting()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other settings
    UPDATE whatsapp_settings 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active setting
CREATE TRIGGER ensure_single_active_whatsapp_setting_trigger
  BEFORE INSERT OR UPDATE ON whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION ensure_single_active_whatsapp_setting();

-- Insert default settings (you should update these with your actual values)
INSERT INTO whatsapp_settings (
  verify_token,
  access_token,
  phone_number_id,
  webhook_url,
  n8n_webhook_url,
  is_active
) VALUES (
  'himam_center_2025_secure_token',
  'YOUR_ACCESS_TOKEN_HERE', -- Update this with your actual token
  'YOUR_PHONE_NUMBER_ID_HERE', -- Update this with your actual phone number ID
  'https://himam-system.vercel.app/api/whatsapp',
  NULL, -- Add your n8n webhook URL here
  true
) ON CONFLICT DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for active settings
CREATE POLICY "whatsapp_settings_select_active" ON whatsapp_settings 
  FOR SELECT USING (is_active = true);

-- Admin write access (adjust as needed based on your auth setup)
CREATE POLICY "whatsapp_settings_insert" ON whatsapp_settings 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "whatsapp_settings_update" ON whatsapp_settings 
  FOR UPDATE USING (true);

CREATE POLICY "whatsapp_settings_delete" ON whatsapp_settings 
  FOR DELETE USING (true);

