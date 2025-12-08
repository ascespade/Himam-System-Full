-- Insurance Claims Vector Embeddings Table
-- Uses pgvector for similarity search to prevent repeated errors

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector embeddings table for insurance claims
-- Stores embeddings of claim descriptions and rejection reasons for similarity search
CREATE TABLE IF NOT EXISTS insurance_claim_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES insurance_claims(id) ON DELETE CASCADE,
  insurance_provider TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  claim_description_embedding vector(1536), -- OpenAI embedding dimension
  rejection_reason_embedding vector(1536), -- If claim was rejected
  claim_metadata JSONB, -- Store structured data: amount, date, status, etc.
  outcome TEXT, -- 'approved', 'rejected', 'pending'
  rejection_reason TEXT,
  error_patterns TEXT[], -- Extracted error patterns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings for learning patterns
-- Stores embeddings of successful and failed patterns
CREATE TABLE IF NOT EXISTS insurance_pattern_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES insurance_learning_patterns(id) ON DELETE CASCADE,
  insurance_provider TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  pattern_embedding vector(1536), -- Embedding of the pattern
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('success', 'failure', 'error', 'requirement')),
  pattern_text TEXT NOT NULL, -- Original text
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_claim_embeddings_description 
  ON insurance_claim_embeddings 
  USING ivfflat (claim_description_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_claim_embeddings_rejection 
  ON insurance_claim_embeddings 
  USING ivfflat (rejection_reason_embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE rejection_reason_embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pattern_embeddings_pattern 
  ON insurance_pattern_embeddings 
  USING ivfflat (pattern_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_claim_embeddings_provider_type 
  ON insurance_claim_embeddings(insurance_provider, claim_type);

CREATE INDEX IF NOT EXISTS idx_pattern_embeddings_provider_type 
  ON insurance_pattern_embeddings(insurance_provider, claim_type, pattern_type);

-- Function to find similar rejected claims using vector similarity
CREATE OR REPLACE FUNCTION find_similar_rejected_claims(
  p_description_embedding vector(1536),
  p_provider TEXT,
  p_claim_type TEXT,
  p_similarity_threshold FLOAT DEFAULT 0.8,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  claim_id UUID,
  similarity FLOAT,
  rejection_reason TEXT,
  error_patterns TEXT[],
  claim_metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ice.claim_id,
    1 - (ice.claim_description_embedding <=> p_description_embedding) AS similarity,
    ice.rejection_reason,
    ice.error_patterns,
    ice.claim_metadata
  FROM insurance_claim_embeddings ice
  WHERE ice.outcome = 'rejected'
    AND ice.insurance_provider = p_provider
    AND ice.claim_type = p_claim_type
    AND ice.claim_description_embedding IS NOT NULL
    AND (1 - (ice.claim_description_embedding <=> p_description_embedding)) >= p_similarity_threshold
  ORDER BY ice.claim_description_embedding <=> p_description_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find successful patterns similar to new claim
CREATE OR REPLACE FUNCTION find_similar_successful_patterns(
  p_description_embedding vector(1536),
  p_provider TEXT,
  p_claim_type TEXT,
  p_similarity_threshold FLOAT DEFAULT 0.75,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  pattern_id UUID,
  similarity FLOAT,
  pattern_text TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ipe.pattern_id,
    1 - (ipe.pattern_embedding <=> p_description_embedding) AS similarity,
    ipe.pattern_text,
    ipe.metadata
  FROM insurance_pattern_embeddings ipe
  WHERE ipe.pattern_type = 'success'
    AND ipe.insurance_provider = p_provider
    AND ipe.claim_type = p_claim_type
    AND ipe.pattern_embedding IS NOT NULL
    AND (1 - (ipe.pattern_embedding <=> p_description_embedding)) >= p_similarity_threshold
  ORDER BY ipe.pattern_embedding <=> p_description_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE insurance_claim_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_pattern_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Doctors can view claim embeddings" ON insurance_claim_embeddings;
DROP POLICY IF EXISTS "System can manage claim embeddings" ON insurance_claim_embeddings;
DROP POLICY IF EXISTS "Doctors can view pattern embeddings" ON insurance_pattern_embeddings;
DROP POLICY IF EXISTS "System can manage pattern embeddings" ON insurance_pattern_embeddings;

CREATE POLICY "Doctors can view claim embeddings" ON insurance_claim_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'doctor', 'insurance')
    )
  );

CREATE POLICY "System can manage claim embeddings" ON insurance_claim_embeddings
  FOR ALL USING (true); -- Managed by system/AI agent

CREATE POLICY "Doctors can view pattern embeddings" ON insurance_pattern_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'doctor', 'insurance')
    )
  );

CREATE POLICY "System can manage pattern embeddings" ON insurance_pattern_embeddings
  FOR ALL USING (true); -- Managed by system/AI agent

