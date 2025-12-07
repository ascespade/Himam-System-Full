-- Create knowledge_base table if it doesn't exist
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('faq', 'article', 'training', 'policy')),
  tags TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if table exists but columns are missing
DO $$
BEGIN
  -- Add category if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'knowledge_base' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE knowledge_base ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'faq';
    ALTER TABLE knowledge_base ADD CONSTRAINT knowledge_base_category_check 
      CHECK (category IN ('faq', 'article', 'training', 'policy'));
  END IF;

  -- Add other missing columns
  ALTER TABLE knowledge_base
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
END $$;

-- Create indexes (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_category') THEN
    CREATE INDEX idx_knowledge_category ON knowledge_base(category);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_created_at') THEN
    CREATE INDEX idx_knowledge_created_at ON knowledge_base(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_tags') THEN
    CREATE INDEX idx_knowledge_tags ON knowledge_base USING GIN(tags);
  END IF;
END $$;

-- Add updated_at trigger (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

