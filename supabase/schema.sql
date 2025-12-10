-- ============================================
-- Himam Enterprise AI System - Complete Schema
-- ============================================
-- Unified settings table for all configuration
-- ============================================

-- Settings table (key-value store for all system config)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Conversations (replaces old conversation_history)
-- See whatsapp_conversations and whatsapp_messages tables for WhatsApp data

-- Appointments (integrated with Google Calendar)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialist TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  calendar_event_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing records
CREATE TABLE IF NOT EXISTS billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  phone TEXT,
  amount NUMERIC NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital signatures (consent forms, etc.)
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  session_id TEXT,
  signature_url TEXT NOT NULL,
  document_type TEXT DEFAULT 'consent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance (WhatsApp indexes are in migration files)
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_billing_patient ON billing(patient_name);
CREATE INDEX IF NOT EXISTS idx_billing_paid ON billing(paid);
CREATE INDEX IF NOT EXISTS idx_signatures_session ON signatures(session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_billing_updated_at
  BEFORE UPDATE ON billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow service role full access, anon read-only for public data)
CREATE POLICY "settings_service_role_all" ON settings
  FOR ALL USING (auth.role() = 'service_role');

-- WhatsApp RLS policies are in migration files

CREATE POLICY "appointments_service_role_all" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "billing_service_role_all" ON billing
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "signatures_service_role_all" ON signatures
  FOR ALL USING (auth.role() = 'service_role');

-- Initial settings (can be updated via admin UI)
INSERT INTO settings (key, value, description) VALUES
  ('GEMINI_KEY', '', 'Google Gemini API Key for AI responses'),
  ('OPENAI_KEY', '', 'OpenAI API Key (fallback AI service)'),
  ('WHATSAPP_TOKEN', '', 'Meta WhatsApp Cloud API Access Token'),
  ('WHATSAPP_PHONE_NUMBER_ID', '', 'WhatsApp Phone Number ID from Meta'),
  ('WHATSAPP_VERIFY_TOKEN', 'meta-webhook-verify-2025', 'Webhook verification token for Meta'),
  ('WHATSAPP_APP_ID', '', 'Meta WhatsApp App ID from Developer Console'),
  ('WHATSAPP_WABA_ID', '', 'WhatsApp Business Account ID (WABA ID)'),
  ('WHATSAPP_PHONE_NUMBER', '', 'WhatsApp Business Phone Number (e.g., +13684645555)'),
  ('GOOGLE_CLIENT_EMAIL', '', 'Google Service Account Email for Calendar integration'),
  ('GOOGLE_PRIVATE_KEY', '', 'Google Service Account Private Key (JSON format)'),
  ('GOOGLE_CALENDAR_ID', '', 'Google Calendar ID for appointments'),
  ('CRM_URL', '', 'External CRM API URL for data synchronization'),
  ('CRM_TOKEN', '', 'CRM API Authentication Token')
ON CONFLICT (key) DO NOTHING;



