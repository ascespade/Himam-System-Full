-- ============================================
-- Migration: Enhance Patients Table
-- ============================================
-- Adds all required medical fields to patients table
-- ============================================

-- Add new columns to patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS national_id VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chronic_diseases TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_date_of_birth ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients(gender);
CREATE INDEX IF NOT EXISTS idx_patients_updated_at ON patients(updated_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add comment for documentation
COMMENT ON TABLE patients IS 'Patient records with complete medical information';
COMMENT ON COLUMN patients.date_of_birth IS 'Patient date of birth';
COMMENT ON COLUMN patients.national_id IS 'Saudi National ID or equivalent';
COMMENT ON COLUMN patients.allergies IS 'Array of known allergies';
COMMENT ON COLUMN patients.chronic_diseases IS 'Array of chronic diseases';
