-- Insurance AI Agent Learning Tables
-- This migration creates tables for AI-powered insurance claims management

-- Insurance Learning Patterns Table
-- Stores learned patterns from previous claims to improve future submissions
CREATE TABLE IF NOT EXISTS insurance_learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_provider TEXT NOT NULL,
  claim_type TEXT NOT NULL, -- 'medical', 'pharmacy', 'lab', 'imaging', 'surgery'
  success_count INTEGER DEFAULT 0,
  rejection_count INTEGER DEFAULT 0,
  common_errors TEXT[] DEFAULT '{}',
  required_fields TEXT[] DEFAULT '{}',
  success_patterns TEXT[] DEFAULT '{}',
  rejection_reasons TEXT[] DEFAULT '{}',
  average_processing_days NUMERIC,
  approval_rate NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(insurance_provider, claim_type)
);

-- Patient Insurance Information
-- Stores patient insurance details for automated claim processing
CREATE TABLE IF NOT EXISTS patient_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  insurance_company TEXT NOT NULL,
  policy_number TEXT,
  member_id TEXT,
  group_number TEXT,
  coverage_percentage NUMERIC DEFAULT 80 CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  copay_amount NUMERIC DEFAULT 0,
  deductible NUMERIC DEFAULT 0,
  effective_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update insurance_claims table to add AI-related fields
ALTER TABLE insurance_claims 
ADD COLUMN IF NOT EXISTS submitted_by_ai BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resubmission_notes TEXT;

-- Enable Row Level Security
ALTER TABLE insurance_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_insurance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insurance_learning_patterns
CREATE POLICY "Doctors can view learning patterns" ON insurance_learning_patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'doctor', 'insurance')
    )
  );

CREATE POLICY "Doctors can update learning patterns" ON insurance_learning_patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'doctor', 'insurance')
    )
  );

-- RLS Policies for patient_insurance
CREATE POLICY "Users can view patient insurance" ON patient_insurance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'doctor', 'staff', 'reception', 'insurance')
    )
  );

CREATE POLICY "Doctors can manage patient insurance" ON patient_insurance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'doctor', 'insurance')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_insurance_learning_patterns_provider_type 
  ON insurance_learning_patterns(insurance_provider, claim_type);

CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient_id 
  ON patient_insurance(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_insurance_active 
  ON patient_insurance(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_insurance_claims_ai_submitted 
  ON insurance_claims(submitted_by_ai) WHERE submitted_by_ai = TRUE;

