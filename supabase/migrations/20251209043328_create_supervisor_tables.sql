-- ============================================
-- Migration: Create Medical Supervisor Tables
-- ============================================
-- Creates tables for medical supervision and review
-- ============================================

-- Update users table to include supervisor role
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'doctor', 'staff', 'patient', 'reception', 'insurance', 'guardian', 'supervisor'));

-- Create supervisor_reviews table
CREATE TABLE IF NOT EXISTS supervisor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('quality', 'compliance', 'critical_case', 'routine')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'needs_correction', 'rejected')),
  findings TEXT,
  recommendations TEXT,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supervisor_quality_metrics table
CREATE TABLE IF NOT EXISTS supervisor_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  reviewed_sessions INTEGER DEFAULT 0,
  quality_score NUMERIC(5,2) CHECK (quality_score >= 0 AND quality_score <= 100),
  compliance_score NUMERIC(5,2) CHECK (compliance_score >= 0 AND compliance_score <= 100),
  critical_cases_count INTEGER DEFAULT 0,
  corrections_required INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, metric_date)
);

-- Create critical_cases table
CREATE TABLE IF NOT EXISTS critical_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  case_type VARCHAR(50) NOT NULL CHECK (case_type IN ('medical_emergency', 'risk_detection', 'compliance_issue', 'quality_concern')),
  severity VARCHAR(20) DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  detected_by VARCHAR(50), -- 'ai', 'doctor', 'supervisor', 'system'
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'escalated')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supervisor_reviews_supervisor_id ON supervisor_reviews(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_reviews_session_id ON supervisor_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_reviews_patient_id ON supervisor_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_reviews_doctor_id ON supervisor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_reviews_status ON supervisor_reviews(status);
CREATE INDEX IF NOT EXISTS idx_supervisor_reviews_priority ON supervisor_reviews(priority);
CREATE INDEX IF NOT EXISTS idx_supervisor_reviews_created_at ON supervisor_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_doctor_id ON supervisor_quality_metrics(doctor_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_metric_date ON supervisor_quality_metrics(metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_critical_cases_patient_id ON critical_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_critical_cases_session_id ON critical_cases(session_id);
CREATE INDEX IF NOT EXISTS idx_critical_cases_status ON critical_cases(status);
CREATE INDEX IF NOT EXISTS idx_critical_cases_severity ON critical_cases(severity);
CREATE INDEX IF NOT EXISTS idx_critical_cases_created_at ON critical_cases(created_at DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_supervisor_reviews_updated_at
  BEFORE UPDATE ON supervisor_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quality_metrics_updated_at
  BEFORE UPDATE ON supervisor_quality_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_critical_cases_updated_at
  BEFORE UPDATE ON critical_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE supervisor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "supervisor_reviews_service_role_all" ON supervisor_reviews
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "supervisor_reviews_supervisor_access" ON supervisor_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "quality_metrics_service_role_all" ON supervisor_quality_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "quality_metrics_supervisor_access" ON supervisor_quality_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "critical_cases_service_role_all" ON critical_cases
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "critical_cases_supervisor_access" ON critical_cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('supervisor', 'admin', 'doctor')
    )
  );

-- Comments
COMMENT ON TABLE supervisor_reviews IS 'Medical supervisor reviews of sessions and cases';
COMMENT ON TABLE supervisor_quality_metrics IS 'Quality metrics for doctors tracked by supervisors';
COMMENT ON TABLE critical_cases IS 'Critical cases requiring supervisor attention';
