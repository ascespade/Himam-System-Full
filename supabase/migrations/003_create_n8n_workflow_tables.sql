-- ============================================
-- Migration: Create tables for n8n AI Learning Workflow
-- ============================================
-- This migration creates the necessary tables for the AlHimam WhatsApp AI workflow
-- Run this file in Supabase SQL Editor
-- ============================================

-- Step 1: Create config table for storing workflow configuration
-- ============================================
CREATE TABLE IF NOT EXISTS config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_config_updated_at 
  BEFORE UPDATE ON config
  FOR EACH ROW EXECUTE FUNCTION update_config_updated_at();

-- Step 2: Create conversation_history table for storing chat history
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_phone ON conversation_history(user_phone);
CREATE INDEX IF NOT EXISTS idx_conversation_history_session_id ON conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_created_at ON conversation_history(created_at DESC);

-- Step 3: Create knowledge_base table for self-learning
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source TEXT DEFAULT 'conversation',
  quality_score TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_question ON knowledge_base(question);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_knowledge_base_updated_at 
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_base_updated_at();

-- Step 4: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
-- ============================================

-- Config table policies
CREATE POLICY "config_select" ON config 
  FOR SELECT USING (true);

CREATE POLICY "config_insert" ON config 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "config_update" ON config 
  FOR UPDATE USING (true);

CREATE POLICY "config_delete" ON config 
  FOR DELETE USING (true);

-- Conversation history policies
CREATE POLICY "conversation_history_select" ON conversation_history 
  FOR SELECT USING (true);

CREATE POLICY "conversation_history_insert" ON conversation_history 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "conversation_history_update" ON conversation_history 
  FOR UPDATE USING (true);

CREATE POLICY "conversation_history_delete" ON conversation_history 
  FOR DELETE USING (true);

-- Knowledge base policies
CREATE POLICY "knowledge_base_select" ON knowledge_base 
  FOR SELECT USING (true);

CREATE POLICY "knowledge_base_insert" ON knowledge_base 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "knowledge_base_update" ON knowledge_base 
  FOR UPDATE USING (true);

CREATE POLICY "knowledge_base_delete" ON knowledge_base 
  FOR DELETE USING (true);

-- Step 6: Insert default configuration values
-- ============================================
-- Note: Update these values with your actual WhatsApp configuration
INSERT INTO config (key, value, description) VALUES
  ('WHATSAPP_PHONE_NUMBER_ID', 'YOUR_PHONE_NUMBER_ID', 'WhatsApp Business Phone Number ID from Meta'),
  ('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY', 'Google Gemini API Key for AI responses'),
  ('MAX_CONVERSATION_HISTORY', '5', 'Maximum number of previous messages to include in context'),
  ('QUALITY_THRESHOLD', '3', 'Minimum quality score for saving to knowledge base')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Migration Complete!
-- ============================================
-- Verify by running:
-- SELECT COUNT(*) FROM config;                    -- Should return 4
-- SELECT COUNT(*) FROM conversation_history;      -- Should return 0 (empty initially)
-- SELECT COUNT(*) FROM knowledge_base;            -- Should return 0 (empty initially)
-- ============================================

