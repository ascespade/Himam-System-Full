-- ============================================
-- Himam Enterprise AI System - COMPLETE SCHEMA UPDATE
-- Date: 2025-12-07
-- Description: Adds all 27 missing tables identified in gap analysis
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. MEDICAL RECORDS SYSTEM
-- ============================================

-- Medical Records (Central table for all clinical data)
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  record_type TEXT NOT NULL CHECK (record_type IN ('visit', 'diagnosis', 'prescription', 'lab_result', 'imaging', 'surgery', 'vaccination', 'note', 'referral')),
  chief_complaint TEXT,
  history TEXT,
  examination TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnoses
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id),
  diagnosis_code TEXT, -- ICD-10 code
  diagnosis_name TEXT NOT NULL,
  diagnosed_date TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id),
  medical_record_id UUID REFERENCES medical_records(id),
  prescribed_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescription Items (Individual medications)
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  is_dispensed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Results
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES medical_records(id),
  test_name TEXT NOT NULL,
  test_type TEXT,
  ordered_by UUID REFERENCES users(id),
  ordered_date TIMESTAMPTZ DEFAULT NOW(),
  performed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  results JSONB, -- Structured results
  interpretation TEXT,
  file_url TEXT,
  is_abnormal BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imaging Results
CREATE TABLE IF NOT EXISTS imaging_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES medical_records(id),
  imaging_type TEXT NOT NULL, -- X-ray, MRI, CT, etc.
  body_part TEXT,
  ordered_by UUID REFERENCES users(id),
  ordered_date TIMESTAMPTZ DEFAULT NOW(),
  performed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  report_text TEXT,
  image_urls TEXT[],
  impression TEXT,
  radiologist_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vital Signs
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  temperature NUMERIC(4,1),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  oxygen_saturation INTEGER,
  weight NUMERIC(5,2),
  height NUMERIC(5,2),
  bmi NUMERIC(4,1),
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vaccinations
CREATE TABLE IF NOT EXISTS vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  dose_number INTEGER,
  administered_date TIMESTAMPTZ,
  administered_by UUID REFERENCES users(id),
  next_dose_date TIMESTAMPTZ,
  batch_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Allergies
CREATE TABLE IF NOT EXISTS patient_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergy_name TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  reaction TEXT,
  diagnosed_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Chronic Conditions
CREATE TABLE IF NOT EXISTS patient_chronic_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  condition_name TEXT NOT NULL,
  diagnosed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications Database (Reference table)
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT,
  form TEXT, -- tablet, syrup, injection
  strength TEXT,
  manufacturer TEXT,
  description TEXT,
  side_effects TEXT,
  contraindications TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. DOCTOR MANAGEMENT
-- ============================================

-- Doctor Profiles
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  license_number TEXT,
  bio_ar TEXT,
  bio_en TEXT,
  education TEXT,
  experience_years INTEGER,
  consultation_fee NUMERIC(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor-Patient Relationships
CREATE TABLE IF NOT EXISTS doctor_patient_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'primary' CHECK (relationship_type IN ('primary', 'consultant', 'referring')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor Schedules
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  slot_duration INTEGER DEFAULT 30, -- minutes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment Slots (Generated from schedules)
CREATE TABLE IF NOT EXISTS appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_booked BOOLEAN DEFAULT FALSE,
  appointment_id UUID REFERENCES appointments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  referring_doctor_id UUID REFERENCES users(id),
  referred_to_doctor_id UUID REFERENCES users(id),
  referred_to_specialty TEXT,
  reason TEXT NOT NULL,
  priority TEXT DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'emergency')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. OPERATIONS & BILLING
-- ============================================

-- Reception Queue
CREATE TABLE IF NOT EXISTS reception_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  queue_number INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled')),
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partially_paid', 'cancelled', 'refunded')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  insurance_claim_id UUID, -- Circular reference handled later if needed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  service_type TEXT, -- consultation, procedure, medication, lab, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Claims
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  invoice_id UUID REFERENCES invoices(id),
  insurance_provider TEXT NOT NULL,
  policy_number TEXT,
  claim_type TEXT,
  service_date DATE,
  total_amount NUMERIC(10,2) NOT NULL,
  covered_amount NUMERIC(10,2),
  patient_responsibility NUMERIC(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'paid')),
  submitted_date TIMESTAMPTZ,
  processed_date TIMESTAMPTZ,
  rejection_reason TEXT,
  resubmission_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  patient_id UUID REFERENCES patients(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'insurance', 'online')),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference_number TEXT,
  notes TEXT,
  processed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. COMMUNICATION & SYSTEM
-- ============================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), -- For staff
  patient_id UUID REFERENCES patients(id), -- For patients
  type TEXT NOT NULL, -- appointment, reminder, result, system, message
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment Reminders
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type TEXT DEFAULT 'whatsapp' CHECK (reminder_type IN ('whatsapp', 'sms', 'email', 'call')),
  reminder_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slack Conversations
CREATE TABLE IF NOT EXISTS slack_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id),
  patient_id UUID REFERENCES patients(id),
  channel_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slack Messages
CREATE TABLE IF NOT EXISTS slack_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES slack_conversations(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('doctor', 'patient', 'system')),
  sender_id UUID, -- User ID or Patient ID
  message_text TEXT,
  attachments JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Attachments
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- medical_record, patient, invoice, etc.
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Consents
CREATE TABLE IF NOT EXISTS patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  consent_type TEXT NOT NULL, -- treatment, surgery, data_sharing, photo
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_given BOOLEAN DEFAULT FALSE,
  given_at TIMESTAMPTZ,
  signature_url TEXT,
  witness_name TEXT,
  witness_signature_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES & TRIGGERS
-- ============================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(date DESC);

CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_status ON lab_results(status);

CREATE INDEX IF NOT EXISTS idx_reception_queue_status ON reception_queue(status);
CREATE INDEX IF NOT EXISTS idx_reception_queue_date ON reception_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON notifications(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;

-- Add updated_at triggers to all new tables
-- Add updated_at triggers to all new tables
DROP TRIGGER IF EXISTS update_medical_records_updated_at ON medical_records;
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_diagnoses_updated_at ON diagnoses;
CREATE TRIGGER update_diagnoses_updated_at BEFORE UPDATE ON diagnoses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_lab_results_updated_at ON lab_results;
CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_imaging_results_updated_at ON imaging_results;
CREATE TRIGGER update_imaging_results_updated_at BEFORE UPDATE ON imaging_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_doctor_profiles_updated_at ON doctor_profiles;
CREATE TRIGGER update_doctor_profiles_updated_at BEFORE UPDATE ON doctor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_doctor_schedules_updated_at ON doctor_schedules;
CREATE TRIGGER update_doctor_schedules_updated_at BEFORE UPDATE ON doctor_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_reception_queue_updated_at ON reception_queue;
CREATE TRIGGER update_reception_queue_updated_at BEFORE UPDATE ON reception_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_insurance_claims_updated_at ON insurance_claims;
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_slack_conversations_updated_at ON slack_conversations;
CREATE TRIGGER update_slack_conversations_updated_at BEFORE UPDATE ON slack_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_patient_consents_updated_at ON patient_consents;
CREATE TRIGGER update_patient_consents_updated_at BEFORE UPDATE ON patient_consents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. RLS POLICIES (Basic Service Role Access)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE imaging_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_chronic_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patient_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reception_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;

-- Create basic service role policies for all tables
-- (More granular user policies will be added in Phase 2)

CREATE POLICY "medical_records_service_role" ON medical_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "diagnoses_service_role" ON diagnoses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "prescriptions_service_role" ON prescriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "prescription_items_service_role" ON prescription_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "lab_results_service_role" ON lab_results FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "imaging_results_service_role" ON imaging_results FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "vital_signs_service_role" ON vital_signs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "vaccinations_service_role" ON vaccinations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "patient_allergies_service_role" ON patient_allergies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "patient_chronic_conditions_service_role" ON patient_chronic_conditions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "medications_service_role" ON medications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "doctor_profiles_service_role" ON doctor_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "doctor_patient_relationships_service_role" ON doctor_patient_relationships FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "doctor_schedules_service_role" ON doctor_schedules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "appointment_slots_service_role" ON appointment_slots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "referrals_service_role" ON referrals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "reception_queue_service_role" ON reception_queue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "invoices_service_role" ON invoices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "invoice_items_service_role" ON invoice_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "insurance_claims_service_role" ON insurance_claims FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "payment_transactions_service_role" ON payment_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "notifications_service_role" ON notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "appointment_reminders_service_role" ON appointment_reminders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "slack_conversations_service_role" ON slack_conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "slack_messages_service_role" ON slack_messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "audit_logs_service_role" ON audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "file_attachments_service_role" ON file_attachments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "patient_consents_service_role" ON patient_consents FOR ALL USING (auth.role() = 'service_role');

-- Add public read access for doctor profiles (needed for booking)
CREATE POLICY "doctor_profiles_public_read" ON doctor_profiles FOR SELECT USING (true);
