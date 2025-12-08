-- ============================================
-- Business Rules & Workflow Management Tables
-- تاريخ: 2025-01-17
-- الهدف: جداول لإدارة القواعد التجارية والـ workflows
-- ============================================

-- ============================================
-- 1. Business Rules Table
-- ============================================

CREATE TABLE IF NOT EXISTS business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'payment_required',
    'insurance_approval_required',
    'first_visit_free',
    'session_data_complete',
    'insurance_template_match',
    'error_pattern_avoid'
  )),
  condition JSONB NOT NULL, -- Complex condition structure
  action TEXT NOT NULL CHECK (action IN ('allow', 'block', 'warn', 'require_approval')),
  priority INTEGER DEFAULT 0, -- Higher = more important
  is_active BOOLEAN DEFAULT TRUE,
  applies_to TEXT[] DEFAULT ARRAY['all'], -- ['reception', 'doctor', 'billing', 'all']
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_rules_type ON business_rules(type);
CREATE INDEX IF NOT EXISTS idx_business_rules_active ON business_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_rules_priority ON business_rules(priority DESC);

-- ============================================
-- 2. Insurance Claim Templates (Learning System)
-- ============================================

CREATE TABLE IF NOT EXISTS insurance_claim_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_provider TEXT NOT NULL,
  service_type TEXT NOT NULL,
  required_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommended_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
  rejection_patterns JSONB DEFAULT '[]'::JSONB,
  success_patterns JSONB DEFAULT '[]'::JSONB,
  success_rate NUMERIC DEFAULT 0.0,
  sample_count INTEGER DEFAULT 0,
  is_successful BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(insurance_provider, service_type)
);

CREATE INDEX IF NOT EXISTS idx_claim_templates_provider_service ON insurance_claim_templates(insurance_provider, service_type);
CREATE INDEX IF NOT EXISTS idx_claim_templates_success_rate ON insurance_claim_templates(success_rate DESC);

-- ============================================
-- 3. Payment Records (Enhanced)
-- ============================================

-- Add fields to existing billing table if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'billing' AND column_name = 'patient_id') THEN
    ALTER TABLE billing ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'billing' AND column_name = 'session_id') THEN
    ALTER TABLE billing ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'billing' AND column_name = 'visit_id') THEN
    ALTER TABLE billing ADD COLUMN visit_id UUID REFERENCES patient_visits(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'billing' AND column_name = 'service_type') THEN
    ALTER TABLE billing ADD COLUMN service_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'billing' AND column_name = 'payment_method') THEN
    ALTER TABLE billing ADD COLUMN payment_method TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'billing' AND column_name = 'payment_date') THEN
    ALTER TABLE billing ADD COLUMN payment_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'billing' AND column_name = 'insurance_claim_id') THEN
    ALTER TABLE billing ADD COLUMN insurance_claim_id UUID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON billing(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_session_id ON billing(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_visit_id ON billing(visit_id) WHERE visit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_paid ON billing(paid, payment_date);

-- ============================================
-- 4. Insurance Approval Workflow
-- ============================================

CREATE TABLE IF NOT EXISTS insurance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES patient_visits(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  insurance_provider TEXT NOT NULL,
  service_type TEXT NOT NULL,
  requested_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  approval_number TEXT,
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  claim_id UUID, -- Reference to insurance_claims if exists
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_approvals_patient_id ON insurance_approvals(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_approvals_status ON insurance_approvals(status);
CREATE INDEX IF NOT EXISTS idx_insurance_approvals_provider ON insurance_approvals(insurance_provider);

-- ============================================
-- 5. Session Validation Logs
-- ============================================

CREATE TABLE IF NOT EXISTS session_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL, -- 'ai_agent', 'template', 'manual'
  is_valid BOOLEAN NOT NULL,
  is_complete BOOLEAN NOT NULL,
  missing_fields TEXT[],
  warnings TEXT[],
  suggestions TEXT[],
  ai_confidence NUMERIC,
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_validation_logs_session_id ON session_validation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_validation_logs_valid ON session_validation_logs(is_valid);

-- ============================================
-- 6. Error Pattern Learning
-- ============================================

CREATE TABLE IF NOT EXISTS error_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL, -- 'insurance_rejection', 'payment_failure', 'data_incomplete'
  error_message TEXT NOT NULL,
  context JSONB, -- Additional context about the error
  frequency INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_error_patterns_type ON error_patterns(error_type);
CREATE INDEX IF NOT EXISTS idx_error_patterns_frequency ON error_patterns(frequency DESC);

-- ============================================
-- 7. Update Function (if not exists)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_business_rules_updated_at ON business_rules;
CREATE TRIGGER update_business_rules_updated_at
  BEFORE UPDATE ON business_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_insurance_approvals_updated_at ON insurance_approvals;
CREATE TRIGGER update_insurance_approvals_updated_at
  BEFORE UPDATE ON insurance_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9. RLS Policies
-- ============================================

ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claim_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_rules_service_role_all" ON business_rules;
CREATE POLICY "business_rules_service_role_all" ON business_rules
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "insurance_claim_templates_service_role_all" ON insurance_claim_templates;
CREATE POLICY "insurance_claim_templates_service_role_all" ON insurance_claim_templates
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "insurance_approvals_service_role_all" ON insurance_approvals;
CREATE POLICY "insurance_approvals_service_role_all" ON insurance_approvals
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "session_validation_logs_service_role_all" ON session_validation_logs;
CREATE POLICY "session_validation_logs_service_role_all" ON session_validation_logs
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "error_patterns_service_role_all" ON error_patterns;
CREATE POLICY "error_patterns_service_role_all" ON error_patterns
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 10. Default Business Rules
-- ============================================

INSERT INTO business_rules (name, description, type, condition, action, priority, applies_to, error_message) VALUES
  (
    'أول زيارة كشف مجاني',
    'السماح بفتح جلسة بدون دفع للزيارة الأولى (كشف فقط)',
    'first_visit_free',
    '{"and": [{"field": "patient.is_first_visit", "equals": true}, {"field": "session.session_type", "equals": "consultation"}]}'::JSONB,
    'allow',
    10,
    ARRAY['reception', 'doctor'],
    'أول زيارة كشف مجاني - لا يتطلب دفع'
  ),
  (
    'الدفع مطلوب قبل الجلسة',
    'منع فتح جلسة بدون دفع الرسوم (ما عدا أول زيارة)',
    'payment_required',
    '{"and": [{"field": "patient.is_first_visit", "not_equals": true}, {"field": "payment.paid", "not_equals": true}, {"field": "insurance.approved", "not_equals": true}]}'::JSONB,
    'block',
    20,
    ARRAY['reception', 'doctor'],
    'يجب دفع الرسوم أو الحصول على موافقة التأمين قبل فتح الجلسة'
  ),
  (
    'التحقق من اكتمال بيانات الجلسة',
    'منع حفظ جلسة بدون اكتمال البيانات المطلوبة',
    'session_data_complete',
    '{"field": "session.is_complete", "equals": false}'::JSONB,
    'block',
    15,
    ARRAY['doctor'],
    'يجب اكتمال جميع البيانات المطلوبة للجلسة قبل الحفظ'
  )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE business_rules IS 'قواعد العمل الديناميكية - قابلة للتعديل من Admin';
COMMENT ON TABLE insurance_claim_templates IS 'قوالب المطالبات - التعلم من المطالبات الناجحة';
COMMENT ON TABLE insurance_approvals IS 'موافقات التأمين - تتبع حالة الموافقات';
COMMENT ON TABLE session_validation_logs IS 'سجلات التحقق من الجلسات - تتبع التحقق من البيانات';
