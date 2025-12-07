-- Update content_items table to include all required fields
-- First check if table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_items') THEN
    CREATE TABLE content_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500),
      title_ar TEXT,
      title_en TEXT,
      description TEXT,
      description_ar TEXT,
      description_en TEXT,
      type TEXT NOT NULL,
      category VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      author VARCHAR(255),
      views INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      icon TEXT,
      value TEXT,
      rating INTEGER,
      name TEXT,
      role TEXT,
      url TEXT,
      platform TEXT,
      is_featured BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add missing columns if they don't exist
    ALTER TABLE content_items
      ADD COLUMN IF NOT EXISTS title VARCHAR(500),
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS author VARCHAR(255),
      ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_items_type') THEN
    CREATE INDEX idx_content_items_type ON content_items(type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_items_status') THEN
    CREATE INDEX idx_content_items_status ON content_items(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_items_category') THEN
    CREATE INDEX idx_content_items_category ON content_items(category);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_items_created_at') THEN
    CREATE INDEX idx_content_items_created_at ON content_items(created_at DESC);
  END IF;
END $$;

-- Add updated_at trigger (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

