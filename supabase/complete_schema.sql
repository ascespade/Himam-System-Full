-- ============================================
-- Himam Enterprise AI System - COMPLETE DATABASE SCHEMA
-- ============================================
-- This file contains ALL tables needed for the system
-- Run this in Supabase SQL Editor to set up the complete database
-- ============================================

-- ============================================
-- CORE TABLES
-- ============================================

-- Settings table (key-value store for all system config)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation history (WhatsApp + AI interactions)
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  nationality TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialists table
CREATE TABLE IF NOT EXISTS specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  nationality TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL,
  date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CMS TABLES (NEW)
-- ============================================

-- Center Information (single row)
CREATE TABLE IF NOT EXISTS center_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  mission_ar TEXT,
  mission_en TEXT,
  vision_ar TEXT,
  vision_en TEXT,
  address_ar TEXT,
  address_en TEXT,
  city_ar TEXT,
  city_en TEXT,
  country_ar TEXT DEFAULT 'المملكة العربية السعودية',
  country_en TEXT DEFAULT 'Saudi Arabia',
  phone TEXT,
  mobile TEXT,
  email TEXT,
  website TEXT,
  whatsapp TEXT,
  logo_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified Content Items (services, testimonials, statistics, etc.)
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('service', 'testimonial', 'statistic', 'value', 'feature', 'social_media')),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT,
  value TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  name TEXT,
  role TEXT,
  url TEXT,
  platform TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Settings
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  verify_token TEXT,
  app_id TEXT,
  waba_id TEXT,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_conversation_history_user_phone ON conversation_history(user_phone);
CREATE INDEX IF NOT EXISTS idx_conversation_history_created_at ON conversation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_billing_patient ON billing(patient_name);
CREATE INDEX IF NOT EXISTS idx_billing_paid ON billing(paid);
CREATE INDEX IF NOT EXISTS idx_signatures_session ON signatures(session_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_specialists_specialty ON specialists(specialty);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_specialist_id ON sessions(specialist_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_is_active ON content_items(is_active);
CREATE INDEX IF NOT EXISTS idx_content_items_order_index ON content_items(order_index);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_billing_updated_at
  BEFORE UPDATE ON billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_center_info_updated_at
  BEFORE UPDATE ON center_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_whatsapp_settings_updated_at
  BEFORE UPDATE ON whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role has full access, anon has read access to public data)
CREATE POLICY "settings_service_role_all" ON settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "conversation_history_service_role_all" ON conversation_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "appointments_service_role_all" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "billing_service_role_all" ON billing
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "signatures_service_role_all" ON signatures
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "patients_service_role_all" ON patients
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "specialists_service_role_all" ON specialists
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "specialists_anon_read" ON specialists
  FOR SELECT USING (true);

CREATE POLICY "sessions_service_role_all" ON sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admins_service_role_all" ON admins
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "center_info_service_role_all" ON center_info
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "center_info_anon_read" ON center_info
  FOR SELECT USING (true);

CREATE POLICY "content_items_service_role_all" ON content_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "content_items_anon_read" ON content_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "whatsapp_settings_service_role_all" ON whatsapp_settings
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SEED DATA
-- ============================================

-- Initial settings
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

-- Center Information (default values)
INSERT INTO center_info (
  name_ar, name_en, 
  description_ar, description_en,
  mission_ar, mission_en,
  vision_ar, vision_en,
  address_ar, address_en,
  city_ar, city_en,
  phone, email
) VALUES (
  'مركز الهمم', 'Al-Himam Center',
  'مركز متخصص في تقديم خدمات العلاج الطبيعي والتأهيل', 'Specialized center for physiotherapy and rehabilitation services',
  'تقديم أفضل خدمات الرعاية الصحية المتخصصة', 'Providing the best specialized healthcare services',
  'أن نكون المركز الرائد في المنطقة', 'To be the leading center in the region',
  'جدة، المملكة العربية السعودية', 'Jeddah, Saudi Arabia',
  'جدة', 'Jeddah',
  '+966 12 345 6789', 'info@al-himam.com'
)
ON CONFLICT DO NOTHING;

-- Sample Specialists
INSERT INTO specialists (name, specialty, nationality, email) VALUES
  ('د. سارة الزهراني', 'علاج النطق', 'سعودية', 'sara.zahrani@al-himam.com'),
  ('أ. عبدالله العتيبي', 'تعديل السلوك', 'سعودي', 'abdullah.alotaibi@al-himam.com'),
  ('أ. ريم بخاش', 'العلاج الوظيفي', 'سعودية', 'reem.bakhash@al-himam.com')
ON CONFLICT DO NOTHING;

-- Sample Patients
INSERT INTO patients (name, nationality, phone, status) VALUES
  ('نواف الحربي', 'سعودي', '+966505812345', 'جلسات نطق'),
  ('لين الغامدي', 'سعودية', '+966502736459', 'علاج سلوكي'),
  ('رهف العبدلي', 'سعودية', '+966506481233', 'علاج وظيفي')
ON CONFLICT DO NOTHING;

-- Sample Services (content_items)
INSERT INTO content_items (type, title_ar, title_en, description_ar, description_en, icon, order_index) VALUES
  ('service', 'حجز المواعيد', 'Appointment Booking', 'احجز موعدك بسهولة عبر الواتساب أو الموقع', 'Book your appointment easily via WhatsApp or website', 'calendar', 1),
  ('service', 'الرد الآلي الذكي', 'Smart Auto-Reply', 'نظام ذكي للرد على استفساراتك على مدار الساعة', 'Intelligent system to answer your inquiries 24/7', 'message', 2),
  ('service', 'التكامل مع الذكاء الاصطناعي', 'AI Integration', 'استخدام الذكاء الاصطناعي لتحسين تجربة المرضى', 'Using AI to enhance patient experience', 'sparkles', 3)
ON CONFLICT DO NOTHING;

-- Sample Testimonials
INSERT INTO content_items (type, title_ar, name, role, description_ar, rating, is_featured, order_index) VALUES
  ('testimonial', 'تجربة رائعة', 'أم محمد', 'ولي أمر', 'الخدمة ممتازة والأخصائيون محترفون جداً. ابني تحسن كثيراً بفضل الله ثم جهودهم', 5, true, 1),
  ('testimonial', 'خدمة متميزة', 'أحمد السعيد', 'مريض', 'مركز متميز بكل المقاييس. العلاج فعال والمتابعة مستمرة', 5, true, 2),
  ('testimonial', 'أفضل مركز', 'فاطمة الأحمدي', 'ولي أمر', 'تعاملهم راقي والنتائج واضحة. أنصح الجميع بالمركز', 5, true, 3)
ON CONFLICT DO NOTHING;

-- Sample Statistics
INSERT INTO content_items (type, title_ar, title_en, value, icon, order_index) VALUES
  ('statistic', 'المرضى', 'Patients', '500+', 'users', 1),
  ('statistic', 'نسبة النجاح', 'Success Rate', '95%', 'chart', 2),
  ('statistic', 'سنوات الخبرة', 'Years Experience', '10+', 'award', 3),
  ('statistic', 'الأخصائيون', 'Specialists', '15+', 'team', 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the schema was applied correctly:
-- 
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' ORDER BY table_name;
--
-- SELECT COUNT(*) FROM center_info;      -- Should return 1
-- SELECT COUNT(*) FROM content_items;    -- Should return 10
-- SELECT COUNT(*) FROM specialists;      -- Should return 3
-- SELECT COUNT(*) FROM patients;         -- Should return 3
-- ============================================
