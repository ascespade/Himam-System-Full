-- ============================================
-- Apply All Migrations - Single File
-- ============================================
-- Copy and paste this entire file into Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/[your-project]/sql
-- ============================================

-- ============================================
-- Migration 1: Create Users Table
-- ============================================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'patient',
  password_hash VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Add updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Migration 2: Create Knowledge Base Table
-- ============================================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON knowledge_base(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING GIN(tags);

-- Add updated_at trigger
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Migration 3: Update Content Items Table
-- ============================================

-- Update content_items table to include all required fields
-- First check if table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_items') THEN
    CREATE TABLE content_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'video', 'image', 'document')),
      category VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
      author VARCHAR(255),
      views INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  ELSE
    -- Add missing columns if they don't exist
    ALTER TABLE content_items
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS author VARCHAR(255),
      ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_category ON content_items(category);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable Row Level Security
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Users table policies
CREATE POLICY "users_service_role_all" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Knowledge base policies
CREATE POLICY "knowledge_base_service_role_all" ON knowledge_base
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "knowledge_base_anon_read" ON knowledge_base
  FOR SELECT USING (true);

-- Content items policies (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'content_items' 
    AND policyname = 'content_items_service_role_all'
  ) THEN
    CREATE POLICY "content_items_service_role_all" ON content_items
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- Verification Queries
-- ============================================
-- Run these after applying migrations to verify:

-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('users', 'knowledge_base', 'content_items')
-- ORDER BY table_name;

-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM knowledge_base;
-- SELECT COUNT(*) FROM content_items;

-- ============================================
-- Migration Complete!
-- ============================================

