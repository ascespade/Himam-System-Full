-- ============================================
-- Al-Himam System - Complete Database Migration
-- ============================================
-- Run this file in Supabase SQL Editor
-- https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu/sql
-- ============================================

-- Step 1: Create Tables
-- ============================================

create table if not exists patients(
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  nationality text,
  status text,
  created_at timestamp default now()
);

create table if not exists specialists(
  id uuid primary key default gen_random_uuid(),
  name text,
  specialty text,
  nationality text,
  email text
);

create table if not exists sessions(
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id),
  specialist_id uuid references specialists(id),
  date timestamp,
  notes text
);

create table if not exists admins(
  id uuid primary key default gen_random_uuid(),
  email text unique,
  role text default 'admin',
  password text
);

create table if not exists cms_content(
  id uuid primary key default gen_random_uuid(),
  section text,
  key text,
  value text
);

-- Step 2: Enable Row Level Security
-- ============================================

alter table patients enable row level security;
alter table specialists enable row level security;
alter table sessions enable row level security;
alter table admins enable row level security;
alter table cms_content enable row level security;

-- Step 3: Create RLS Policies
-- ============================================

-- Patients policies
create policy "patients_select" on patients for select using (true);
create policy "patients_insert" on patients for insert with check (true);
create policy "patients_update" on patients for update using (true);
create policy "patients_delete" on patients for delete using (false); -- Only admins can delete

-- Specialists policies
create policy "specialists_select" on specialists for select using (true);
create policy "specialists_insert" on specialists for insert with check (false); -- Only admins
create policy "specialists_update" on specialists for update using (false); -- Only admins
create policy "specialists_delete" on specialists for delete using (false); -- Only admins

-- Sessions policies
create policy "sessions_select" on sessions for select using (true);
create policy "sessions_insert" on sessions for insert with check (true);
create policy "sessions_update" on sessions for update using (true);
create policy "sessions_delete" on sessions for delete using (false); -- Only admins

-- Admins policies (full access for authenticated admins)
create policy "admins_select" on admins for select using (true);
create policy "admins_insert" on admins for insert with check (false); -- Only super admins
create policy "admins_update" on admins for update using (false); -- Only super admins
create policy "admins_delete" on admins for delete using (false); -- Only super admins

-- CMS Content policies
create policy "cms_content_select" on cms_content for select using (true);
create policy "cms_content_insert" on cms_content for insert with check (false); -- Only admins
create policy "cms_content_update" on cms_content for update using (false); -- Only admins
create policy "cms_content_delete" on cms_content for delete using (false); -- Only admins

-- Step 4: Insert Seed Data
-- ============================================

-- Insert specialists
insert into specialists (name,specialty,nationality,email) values
('Dr. Sara Al-Zahrani','Speech Therapy','Saudi','sara.zahrani@al-himam.com.sa'),
('Mr. Abdullah Al-Otaibi','Behavior Modification','Saudi','abdullah.alotaibi@al-himam.com.sa'),
('Ms. Reem Bakhash','Occupational Therapy','Saudi','reem.bakhash@al-himam.com.sa')
on conflict do nothing;

-- Insert patients
insert into patients (name,nationality,phone,status) values
('Nawaf Al-Harbi','Saudi','+966505812345','Speech Sessions'),
('Leen Al-Ghamdi','Saudi','+966502736459','Behavior Therapy'),
('Rahaf Al-Abdali','Saudi','+966506481233','Occupational Therapy')
on conflict do nothing;

-- ============================================
-- Migration Complete!
-- ============================================
-- Verify by running:
-- SELECT COUNT(*) FROM specialists;  -- Should return 3
-- SELECT COUNT(*) FROM patients;     -- Should return 3
-- ============================================

