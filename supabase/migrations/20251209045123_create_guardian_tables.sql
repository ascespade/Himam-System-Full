-- ============================================
-- Migration: Create Guardian Tables
-- ============================================
-- Creates guardian-patient relationship tables
-- ============================================

-- Update users table to include guardian role
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'doctor', 'staff', 'patient', 'reception', 'insurance', 'guardian'));

-- Create guardian_patient_relationships table
CREATE TABLE IF NOT EXISTS guardian_patient_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('parent', 'guardian', 'spouse', 'sibling', 'other')),
  is_primary BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '{"view_records": true, "view_appointments": true, "approve_procedures": false, "view_billing": false}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guardian_id, patient_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guardian_relationships_guardian_id ON guardian_patient_relationships(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_relationships_patient_id ON guardian_patient_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_guardian_relationships_is_primary ON guardian_patient_relationships(is_primary);
CREATE INDEX IF NOT EXISTS idx_guardian_relationships_is_active ON guardian_patient_relationships(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_guardian_relationships_updated_at
  BEFORE UPDATE ON guardian_patient_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE guardian_patient_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guardian_patient_relationships
CREATE POLICY "guardian_relationships_service_role_all" ON guardian_patient_relationships
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Guardians can view their own relationships
CREATE POLICY "guardian_relationships_guardian_select" ON guardian_patient_relationships
  FOR SELECT USING (
    auth.uid() = guardian_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'reception', 'doctor')
    )
  );

-- Policy: Only admins/reception can create relationships
CREATE POLICY "guardian_relationships_admin_insert" ON guardian_patient_relationships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'reception')
    )
  );

-- Policy: Only admins/reception can update relationships
CREATE POLICY "guardian_relationships_admin_update" ON guardian_patient_relationships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'reception')
    )
  );

-- Comments
COMMENT ON TABLE guardian_patient_relationships IS 'Relationships between guardians and patients';
COMMENT ON COLUMN guardian_patient_relationships.permissions IS 'JSON object defining what the guardian can access';
