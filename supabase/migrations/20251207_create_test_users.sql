-- ============================================
-- Create Test Users for All Roles
-- ============================================
-- NOTE: Run this in Supabase SQL Editor
-- These users will be created in auth.users and public.users

-- The trigger handle_new_user() will automatically create entries in public.users
-- So we only need to create auth users here

-- 1. Doctor User
-- Email: doctor@himam.com
-- Password: Doctor@123
-- You need to create this user via Supabase Dashboard > Authentication > Users
-- Then update the role in public.users

-- 2. Reception User
-- Email: reception@himam.com
-- Password: Reception@123

-- 3. Insurance User
-- Email: insurance@himam.com
-- Password: Insurance@123

-- After creating users in Supabase Dashboard, run this to set their roles:

-- Update doctor role
UPDATE public.users
SET role = 'doctor',
    name = 'Dr. Ahmed Hassan',
    specialty = 'General Practitioner'
WHERE email = 'doctor@himam.com';

-- Update reception role
UPDATE public.users
SET role = 'reception',
    name = 'Sara Mohammed'
WHERE email = 'reception@himam.com';

-- Update insurance role
UPDATE public.users
SET role = 'insurance',
    name = 'Fatima Ali'
WHERE email = 'insurance@himam.com';

-- Verify users
SELECT id, email, name, role, specialty
FROM public.users
ORDER BY role;
