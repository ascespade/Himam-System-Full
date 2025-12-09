-- ============================================
-- Migration: Enable Vector Extension
-- ============================================
-- Enables pgvector extension for knowledge base embeddings
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge_base_embeddings table for vector storage
CREATE TABLE IF NOT EXISTS knowledge_base_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID REFERENCES knowledge_base(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension, adjust if using different model
  chunk_index INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector index for similarity search (using HNSW for performance)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_vector 
ON knowledge_base_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_knowledge_base_id 
ON knowledge_base_embeddings(knowledge_base_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings_chunk_index 
ON knowledge_base_embeddings(knowledge_base_id, chunk_index);

-- Add trigger for updated_at
CREATE TRIGGER update_knowledge_base_embeddings_updated_at
  BEFORE UPDATE ON knowledge_base_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE knowledge_base_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "knowledge_base_embeddings_service_role_all" ON knowledge_base_embeddings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "knowledge_base_embeddings_anon_read" ON knowledge_base_embeddings
  FOR SELECT USING (true);

-- Function for similarity search
CREATE OR REPLACE FUNCTION search_knowledge_similarity(
  query_embedding vector(1536),
  similarity_threshold NUMERIC DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  knowledge_base_id UUID,
  content_chunk TEXT,
  similarity NUMERIC,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kbe.id,
    kbe.knowledge_base_id,
    kbe.content_chunk,
    1 - (kbe.embedding <=> query_embedding) AS similarity,
    kbe.metadata
  FROM knowledge_base_embeddings kbe
  WHERE 1 - (kbe.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY kbe.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE knowledge_base_embeddings IS 'Vector embeddings for knowledge base semantic search';
COMMENT ON FUNCTION search_knowledge_similarity IS 'Performs similarity search on knowledge base embeddings';
