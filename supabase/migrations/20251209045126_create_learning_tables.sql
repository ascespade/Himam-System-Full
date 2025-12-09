-- ============================================
-- Migration: Create Learning Tables
-- ============================================
-- Creates tables for continuous learning system
-- ============================================

-- Create template_learning table
CREATE TABLE IF NOT EXISTS template_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('whatsapp_response', 'ai_prompt', 'notification', 'documentation')),
  pattern TEXT NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_name, template_type)
);

-- Create error_pattern_learning table
CREATE TABLE IF NOT EXISTS error_pattern_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  context JSONB,
  rejection_reason TEXT,
  pattern_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the pattern
  occurrence_count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  last_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_learning_logs table
CREATE TABLE IF NOT EXISTS ai_learning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('whatsapp', 'api', 'internal', 'training')),
  input_data JSONB NOT NULL,
  output_data JSONB,
  model_used VARCHAR(100),
  prompt_template_id UUID REFERENCES template_learning(id) ON DELETE SET NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  cost_estimate NUMERIC(10,4),
  user_feedback VARCHAR(20) CHECK (user_feedback IN ('positive', 'negative', 'neutral', 'none')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_template_learning_type ON template_learning(template_type);
CREATE INDEX IF NOT EXISTS idx_template_learning_success_rate ON template_learning(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_template_learning_is_active ON template_learning(is_active);
CREATE INDEX IF NOT EXISTS idx_template_learning_last_used_at ON template_learning(last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_pattern_learning_error_type ON error_pattern_learning(error_type);
CREATE INDEX IF NOT EXISTS idx_error_pattern_learning_pattern_hash ON error_pattern_learning(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_error_pattern_learning_is_resolved ON error_pattern_learning(is_resolved);
CREATE INDEX IF NOT EXISTS idx_error_pattern_learning_occurrence_count ON error_pattern_learning(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_error_pattern_learning_last_occurred_at ON error_pattern_learning(last_occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_learning_logs_interaction_type ON ai_learning_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_logs_success ON ai_learning_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_learning_logs_created_at ON ai_learning_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_learning_logs_prompt_template_id ON ai_learning_logs(prompt_template_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_logs_user_feedback ON ai_learning_logs(user_feedback);

-- Add trigger for updated_at
CREATE TRIGGER update_template_learning_updated_at
  BEFORE UPDATE ON template_learning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_error_pattern_learning_updated_at
  BEFORE UPDATE ON error_pattern_learning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update success rate automatically
CREATE OR REPLACE FUNCTION update_template_success_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.success_count + NEW.failure_count > 0 THEN
    NEW.success_rate = (NEW.success_count::NUMERIC / (NEW.success_count + NEW.failure_count)::NUMERIC) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_learning_success_rate
  BEFORE INSERT OR UPDATE ON template_learning
  FOR EACH ROW EXECUTE FUNCTION update_template_success_rate();

-- Enable RLS
ALTER TABLE template_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_pattern_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "template_learning_service_role_all" ON template_learning
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "template_learning_admin_access" ON template_learning
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "error_pattern_learning_service_role_all" ON error_pattern_learning
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "error_pattern_learning_admin_access" ON error_pattern_learning
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "ai_learning_logs_service_role_all" ON ai_learning_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "ai_learning_logs_admin_access" ON ai_learning_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'supervisor')
    )
  );

-- Comments
COMMENT ON TABLE template_learning IS 'AI template learning and optimization';
COMMENT ON TABLE error_pattern_learning IS 'Error pattern tracking and learning';
COMMENT ON TABLE ai_learning_logs IS 'Comprehensive AI interaction logs for learning';
