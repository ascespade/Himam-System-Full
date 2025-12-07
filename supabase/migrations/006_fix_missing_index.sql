-- ============================================
-- Fix Missing Index
-- ============================================

-- Add missing index on patients.phone
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);


