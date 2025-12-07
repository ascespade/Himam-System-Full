-- ============================================
-- QUICK SETUP: Assign Roles to Your 2 Users
-- ============================================
-- Copy this entire script and run it in Supabase SQL Editor

-- First, let's see what users you have
SELECT id, email, name, role, phone
FROM public.users
ORDER BY created_at DESC;

-- ============================================
-- ASSIGN ROLES (Update the emails to match your users)
-- ============================================

-- User 1: Make this user a DOCTOR
UPDATE public.users
SET
    role = 'doctor',
    name = 'Dr. Ahmed Hassan',
    specialty = 'General Practitioner'
WHERE email = 'YOUR_FIRST_USER_EMAIL@example.com';  -- ⚠️ CHANGE THIS EMAIL

-- User 2: Make this user RECEPTION
UPDATE public.users
SET
    role = 'reception',
    name = 'Sara Mohammed'
WHERE email = 'YOUR_SECOND_USER_EMAIL@example.com';  -- ⚠️ CHANGE THIS EMAIL

-- ============================================
-- VERIFY: Check that roles were assigned
-- ============================================
SELECT id, email, name, role, specialty
FROM public.users
ORDER BY role;

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Replace 'YOUR_FIRST_USER_EMAIL@example.com' with your first user's email
-- 2. Replace 'YOUR_SECOND_USER_EMAIL@example.com' with your second user's email
-- 3. Run this script in Supabase Dashboard > SQL Editor
-- 4. Check the results to confirm roles are assigned
-- 5. Try logging in with both users!
