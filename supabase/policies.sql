-- Enable Row Level Security on all tables
alter table patients enable row level security;
alter table specialists enable row level security;
alter table sessions enable row level security;
alter table admins enable row level security;
alter table cms_content enable row level security;

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
