-- ============================================
-- Enable Supabase Features: Vector, Realtime, Storage
-- ============================================
-- Project: gpcxowqljayhkxyybfqu
-- ============================================

-- Step 1: Enable pgvector Extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Enable Realtime for Tables
-- ============================================
-- Add tables to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS patients;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS specialists;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS admins;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS cms_content;

-- Step 3: Verify Extensions
-- ============================================
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension 
WHERE extname IN ('vector', 'pg_graphql')
ORDER BY extname;

-- Step 4: Verify Realtime Tables
-- ============================================
SELECT 
  schemaname,
  tablename,
  pubname as publication
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================
-- Storage Setup (Run in Supabase Dashboard)
-- ============================================
-- Go to: Storage → Create Bucket
-- 
-- Bucket: "documents"
-- - Public: false (private)
---- File size limit: 50MB
---- Allowed MIME types: image/*, application/pdf, application/msword
--
-- Bucket: "signatures"
-- - Public: false (private)
-- - File size limit: 5MB
-- - Allowed MIME types: image/png, image/jpeg
--
-- Bucket: "media"
-- - Public: true (for public assets)
-- - File size limit: 100MB
-- - Allowed MIME types: image/*, video/*
-- ============================================

-- Step 5: Create Storage Policies (if needed)
-- ============================================
-- These will be created via Supabase Dashboard Storage section
-- Or via Supabase Storage API

-- ============================================
-- Verification Queries
-- ============================================

-- Check vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check Realtime tables
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ============================================
-- Notes:
-- ============================================
-- 1. Vector extension: ✅ Enabled
-- 2. Realtime: ✅ Enabled for all tables
-- 3. Storage: Configure via Supabase Dashboard
--    - Go to Storage section
--    - Create buckets as specified above
--    - Set up policies for access control
-- ============================================

