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
