-- ============================================
-- Doctor Working Hours & Clinic Settings
-- جداول أوقات عمل الأطباء وإعدادات العيادة
-- ============================================

-- Doctor Working Hours (Weekly/Monthly Planning)
CREATE TABLE IF NOT EXISTS doctor_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Day of week (0=Sunday, 6=Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Working hours
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Break time (optional)
  break_start TIME,
  break_end TIME,
  
  -- Slot configuration
  slot_duration_minutes INTEGER DEFAULT 30 CHECK (slot_duration_minutes > 0),
  max_appointments_per_day INTEGER DEFAULT 20,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_working_day BOOLEAN DEFAULT TRUE,
  
  -- Date range (for monthly planning)
  valid_from DATE,
  valid_until DATE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_break_time CHECK (
    (break_start IS NULL AND break_end IS NULL) OR
    (break_start IS NOT NULL AND break_end IS NOT NULL AND break_end > break_start)
  )
);

-- Clinic Settings (Open/Close, Capacity, etc.)
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Clinic status
  is_open BOOLEAN DEFAULT FALSE,
  auto_open_time TIME,
  auto_close_time TIME,
  
  -- Capacity
  daily_capacity INTEGER DEFAULT 20,
  current_queue_count INTEGER DEFAULT 0,
  
  -- Appointment settings
  appointment_buffer_minutes INTEGER DEFAULT 15,
  allow_same_day_booking BOOLEAN DEFAULT TRUE,
  allow_online_booking BOOLEAN DEFAULT TRUE,
  booking_advance_days INTEGER DEFAULT 30,
  
  -- Consultation fee
  consultation_fee NUMERIC(10, 2) DEFAULT 0,
  follow_up_fee NUMERIC(10, 2) DEFAULT 0,
  
  -- Notifications
  notify_on_new_appointment BOOLEAN DEFAULT TRUE,
  notify_on_cancellation BOOLEAN DEFAULT TRUE,
  notify_before_appointment_minutes INTEGER DEFAULT 30,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Working Hours Templates (Save and reuse schedules)
CREATE TABLE IF NOT EXISTS working_hours_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template data (JSON)
  schedule_data JSONB NOT NULL,
  
  -- Usage
  is_default BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doctor_working_hours_doctor_id ON doctor_working_hours(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_working_hours_day ON doctor_working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_working_hours_valid_dates ON doctor_working_hours(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_doctor_id ON clinic_settings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_templates_doctor_id ON working_hours_templates(doctor_id);

-- RLS Policies
ALTER TABLE doctor_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours_templates ENABLE ROW LEVEL SECURITY;

-- Policies for doctor_working_hours
CREATE POLICY "Doctors can manage their own working hours"
  ON doctor_working_hours
  FOR ALL
  USING (auth.uid() = doctor_id);

-- Policies for clinic_settings
CREATE POLICY "Doctors can manage their own clinic settings"
  ON clinic_settings
  FOR ALL
  USING (auth.uid() = doctor_id);

-- Policies for working_hours_templates
CREATE POLICY "Doctors can manage their own templates"
  ON working_hours_templates
  FOR ALL
  USING (auth.uid() = doctor_id);

COMMENT ON TABLE doctor_working_hours IS 'أوقات عمل الأطباء الأسبوعية والشهرية';
COMMENT ON TABLE clinic_settings IS 'إعدادات العيادة (فتح/إغلاق، السعة، إلخ)';
COMMENT ON TABLE working_hours_templates IS 'قوالب جداول العمل (للحفظ والاستخدام)';

