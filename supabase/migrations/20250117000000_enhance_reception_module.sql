-- ============================================
-- Reception Module Enhancement Migration
-- تاريخ: 2025-01-17
-- الهدف: تطوير قاعدة البيانات لدعم موديول الاستقبال الكامل
-- ============================================

-- ============================================
-- 1. تطوير جدول patients
-- ============================================

-- إضافة الحقول المفقودة لجدول patients
DO $$
BEGIN
  -- Email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'email') THEN
    ALTER TABLE patients ADD COLUMN email TEXT;
  END IF;

  -- Date of birth
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'date_of_birth') THEN
    ALTER TABLE patients ADD COLUMN date_of_birth DATE;
  END IF;

  -- Gender
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'gender') THEN
    ALTER TABLE patients ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));
  END IF;

  -- Address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'address') THEN
    ALTER TABLE patients ADD COLUMN address TEXT;
  END IF;

  -- Blood type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'blood_type') THEN
    ALTER TABLE patients ADD COLUMN blood_type TEXT;
  END IF;

  -- Allergies (array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'allergies') THEN
    ALTER TABLE patients ADD COLUMN allergies TEXT[];
  END IF;

  -- Chronic diseases (array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'chronic_diseases') THEN
    ALTER TABLE patients ADD COLUMN chronic_diseases TEXT[];
  END IF;

  -- Emergency contact
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'emergency_contact_name') THEN
    ALTER TABLE patients ADD COLUMN emergency_contact_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'emergency_contact_phone') THEN
    ALTER TABLE patients ADD COLUMN emergency_contact_phone TEXT;
  END IF;

  -- Notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'notes') THEN
    ALTER TABLE patients ADD COLUMN notes TEXT;
  END IF;

  -- Updated at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'patients' AND column_name = 'updated_at') THEN
    ALTER TABLE patients ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Indexes for patients
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_phone_unique ON patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. تطوير جدول appointments
-- ============================================

-- ربط appointments مع patients و doctors
DO $$
BEGIN
  -- Patient ID (foreign key)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'patient_id') THEN
    ALTER TABLE appointments ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
  END IF;

  -- Doctor ID (foreign key to users)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'doctor_id') THEN
    ALTER TABLE appointments ADD COLUMN doctor_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Duration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'duration') THEN
    ALTER TABLE appointments ADD COLUMN duration INTEGER DEFAULT 30; -- minutes
  END IF;

  -- Service type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'service_type') THEN
    ALTER TABLE appointments ADD COLUMN service_type TEXT;
  END IF;

  -- Confirmed at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'confirmed_at') THEN
    ALTER TABLE appointments ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;

  -- Cancelled at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'cancelled_at') THEN
    ALTER TABLE appointments ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;

  -- Cancellation reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT;
  END IF;
END $$;

-- Update status constraint
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
  
  -- Add new constraint with more statuses
  ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled'));
END $$;

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================
-- 3. إنشاء/تطوير جدول reception_queue
-- ============================================

CREATE TABLE IF NOT EXISTS reception_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  receptionist_id UUID REFERENCES users(id) ON DELETE SET NULL,
  queue_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'vip')),
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reception_queue
CREATE INDEX IF NOT EXISTS idx_reception_queue_patient_id ON reception_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_reception_queue_appointment_id ON reception_queue(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reception_queue_doctor_id ON reception_queue(doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reception_queue_receptionist_id ON reception_queue(receptionist_id) WHERE receptionist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reception_queue_status_created ON reception_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reception_queue_queue_number ON reception_queue(queue_number);
CREATE INDEX IF NOT EXISTS idx_reception_queue_date ON reception_queue(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_reception_queue_updated_at ON reception_queue;
CREATE TRIGGER update_reception_queue_updated_at
  BEFORE UPDATE ON reception_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. إنشاء/تطوير جدول patient_visits
-- ============================================

CREATE TABLE IF NOT EXISTS patient_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  queue_id UUID REFERENCES reception_queue(id) ON DELETE SET NULL,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_time TIMESTAMPTZ,
  confirmed_to_doctor_time TIMESTAMPTZ,
  with_doctor_time TIMESTAMPTZ,
  completed_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed_to_doctor', 'with_doctor', 'completed', 'cancelled')),
  visit_type TEXT DEFAULT 'regular' CHECK (visit_type IN ('regular', 'follow_up', 'emergency', 'consultation')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for patient_visits
CREATE INDEX IF NOT EXISTS idx_patient_visits_patient_id ON patient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_appointment_id ON patient_visits(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_visits_queue_id ON patient_visits(queue_id) WHERE queue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_visits_doctor_id ON patient_visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_status_created ON patient_visits(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_visits_visit_date ON patient_visits(visit_date DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_patient_visits_updated_at ON patient_visits;
CREATE TRIGGER update_patient_visits_updated_at
  BEFORE UPDATE ON patient_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. إنشاء/تطوير جدول patient_insurance
-- ============================================

CREATE TABLE IF NOT EXISTS patient_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  policy_holder_name TEXT,
  relationship_to_patient TEXT,
  coverage_start_date DATE,
  coverage_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, policy_number)
);

-- Indexes for patient_insurance
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient_id ON patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_active ON patient_insurance(patient_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_patient_insurance_provider ON patient_insurance(provider);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_patient_insurance_updated_at ON patient_insurance;
CREATE TRIGGER update_patient_insurance_updated_at
  BEFORE UPDATE ON patient_insurance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. Enable Realtime for new tables
-- ============================================

-- Enable Realtime for reception_queue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reception_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reception_queue;
  END IF;
END $$;

-- Enable Realtime for patient_visits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'patient_visits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE patient_visits;
  END IF;
END $$;

-- Enable Realtime for appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  END IF;
END $$;

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE reception_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_insurance ENABLE ROW LEVEL SECURITY;

-- Reception Queue Policies
DROP POLICY IF EXISTS "reception_queue_service_role_all" ON reception_queue;
CREATE POLICY "reception_queue_service_role_all" ON reception_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Patient Visits Policies
DROP POLICY IF EXISTS "patient_visits_service_role_all" ON patient_visits;
CREATE POLICY "patient_visits_service_role_all" ON patient_visits
  FOR ALL USING (auth.role() = 'service_role');

-- Patient Insurance Policies
DROP POLICY IF EXISTS "patient_insurance_service_role_all" ON patient_insurance;
CREATE POLICY "patient_insurance_service_role_all" ON patient_insurance
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 8. Functions for Queue Management
-- ============================================

-- Function to get next queue number for today
CREATE OR REPLACE FUNCTION get_next_queue_number()
RETURNS INTEGER AS $$
DECLARE
  today_start TIMESTAMPTZ;
  today_end TIMESTAMPTZ;
  max_queue INTEGER;
BEGIN
  today_start := DATE_TRUNC('day', NOW());
  today_end := today_start + INTERVAL '1 day';
  
  SELECT COALESCE(MAX(queue_number), 0) INTO max_queue
  FROM reception_queue
  WHERE created_at >= today_start AND created_at < today_end;
  
  RETURN max_queue + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration Complete
-- ============================================

COMMENT ON TABLE reception_queue IS 'طابور الاستقبال - إدارة المرضى في الانتظار';
COMMENT ON TABLE patient_visits IS 'زيارات المرضى - الربط بين الاستقبال والطبيب';
COMMENT ON TABLE patient_insurance IS 'معلومات التأمين للمرضى';
