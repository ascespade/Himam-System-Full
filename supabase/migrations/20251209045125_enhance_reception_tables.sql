-- ============================================
-- Migration: Enhance Reception Tables
-- ============================================
-- Enhances reception workflow tables
-- ============================================

-- Create reception_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS reception_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  queue_number INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'confirmed', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  service_type VARCHAR(100),
  notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed_to_doctor_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists
ALTER TABLE reception_queue
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS service_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmed_to_doctor_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create patient_visits table (links reception to doctor)
CREATE TABLE IF NOT EXISTS patient_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES reception_queue(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ NOT NULL,
  visit_type VARCHAR(50) DEFAULT 'consultation' CHECK (visit_type IN ('consultation', 'follow_up', 'emergency', 'routine')),
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  reception_notes TEXT,
  doctor_notes TEXT,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'paid', 'waived')),
  insurance_status VARCHAR(50) DEFAULT 'pending' CHECK (insurance_status IN ('pending', 'approved', 'rejected', 'not_applicable')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists (handle existing table structure)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_visits') THEN
    -- Add all required columns
    ALTER TABLE patient_visits
      ADD COLUMN IF NOT EXISTS queue_id UUID,
      ADD COLUMN IF NOT EXISTS session_id UUID,
      ADD COLUMN IF NOT EXISTS visit_date TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS visit_type VARCHAR(50) DEFAULT 'consultation',
      ADD COLUMN IF NOT EXISTS reception_notes TEXT,
      ADD COLUMN IF NOT EXISTS doctor_notes TEXT,
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS insurance_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS created_by UUID,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'patient_visits' 
      AND constraint_name = 'patient_visits_queue_id_fkey'
    ) THEN
      ALTER TABLE patient_visits 
        ADD CONSTRAINT patient_visits_queue_id_fkey 
        FOREIGN KEY (queue_id) REFERENCES reception_queue(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'patient_visits' 
      AND constraint_name = 'patient_visits_session_id_fkey'
    ) THEN
      ALTER TABLE patient_visits 
        ADD CONSTRAINT patient_visits_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'patient_visits' 
      AND constraint_name = 'patient_visits_created_by_fkey'
    ) THEN
      ALTER TABLE patient_visits 
        ADD CONSTRAINT patient_visits_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Create patient_insurance table if it doesn't exist
CREATE TABLE IF NOT EXISTS patient_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider VARCHAR(255) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  policy_holder_name VARCHAR(255),
  coverage_type VARCHAR(50),
  coverage_start_date DATE,
  coverage_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verification_notes TEXT,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, policy_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reception_queue_patient_id ON reception_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_reception_queue_status ON reception_queue(status);
CREATE INDEX IF NOT EXISTS idx_reception_queue_priority ON reception_queue(priority);
CREATE INDEX IF NOT EXISTS idx_reception_queue_created_at ON reception_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reception_queue_assigned_to ON reception_queue(assigned_to);

CREATE INDEX IF NOT EXISTS idx_patient_visits_patient_id ON patient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_queue_id ON patient_visits(queue_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_session_id ON patient_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_visit_date ON patient_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_visits_status ON patient_visits(status);
CREATE INDEX IF NOT EXISTS idx_patient_visits_payment_status ON patient_visits(payment_status);
CREATE INDEX IF NOT EXISTS idx_patient_visits_insurance_status ON patient_visits(insurance_status);

CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient_id ON patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_provider ON patient_insurance(provider);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_is_active ON patient_insurance(is_active);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_verification_status ON patient_insurance(verification_status);

-- Add triggers for updated_at
CREATE TRIGGER update_reception_queue_updated_at
  BEFORE UPDATE ON reception_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patient_visits_updated_at
  BEFORE UPDATE ON patient_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patient_insurance_updated_at
  BEFORE UPDATE ON patient_insurance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE reception_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_insurance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "reception_queue_service_role_all" ON reception_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "reception_queue_reception_access" ON reception_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('reception', 'admin', 'doctor')
    )
  );

CREATE POLICY "patient_visits_service_role_all" ON patient_visits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "patient_visits_reception_access" ON patient_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('reception', 'admin', 'doctor')
    )
  );

CREATE POLICY "patient_insurance_service_role_all" ON patient_insurance
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "patient_insurance_reception_access" ON patient_insurance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('reception', 'admin', 'doctor', 'insurance')
    )
  );

-- Enable Realtime for reception_queue
-- Note: Realtime publication is managed by Supabase, these commands may need to be run manually
-- ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS reception_queue;
-- ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS patient_visits;

-- Comments
COMMENT ON TABLE reception_queue IS 'Queue management for reception workflow';
COMMENT ON TABLE patient_visits IS 'Links reception workflow to doctor sessions';
COMMENT ON TABLE patient_insurance IS 'Patient insurance information and verification';
