-- ============================================
-- Patient Visits Table
-- جدول زيارات المرضى للطبيب
-- ============================================
-- يستخدم لتتبع حالة المريض من الاستقبال إلى الطبيب
-- ============================================

CREATE TABLE IF NOT EXISTS patient_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Visit status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'confirmed_to_doctor',
    'with_doctor',
    'completed',
    'cancelled'
  )),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_to_doctor_time TIMESTAMPTZ,
  doctor_seen_time TIMESTAMPTZ,
  visit_completed_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional info
  notes TEXT,
  reception_notes TEXT,
  doctor_notes TEXT,
  
  -- Metadata
  visit_type TEXT DEFAULT 'regular' CHECK (visit_type IN ('regular', 'follow_up', 'emergency', 'consultation')),
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 5)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_visits_doctor_id ON patient_visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_patient_id ON patient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_status ON patient_visits(status);
CREATE INDEX IF NOT EXISTS idx_patient_visits_created_at ON patient_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_visits_appointment_id ON patient_visits(appointment_id);

-- RLS Policies (if needed)
ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can see their own visits
CREATE POLICY "Doctors can view their own visits"
  ON patient_visits
  FOR SELECT
  USING (auth.uid() = doctor_id);

-- Policy: Reception can manage visits
CREATE POLICY "Reception can manage visits"
  ON patient_visits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'reception', 'staff')
    )
  );

-- Policy: Doctors can update their own visits
CREATE POLICY "Doctors can update their own visits"
  ON patient_visits
  FOR UPDATE
  USING (auth.uid() = doctor_id);

COMMENT ON TABLE patient_visits IS 'تتبع زيارات المرضى من الاستقبال إلى الطبيب';
COMMENT ON COLUMN patient_visits.status IS 'حالة الزيارة: pending, confirmed_to_doctor, with_doctor, completed, cancelled';
COMMENT ON COLUMN patient_visits.visit_type IS 'نوع الزيارة: regular, follow_up, emergency, consultation';

