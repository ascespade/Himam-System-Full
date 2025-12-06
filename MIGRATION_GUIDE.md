# 🗄️ Supabase Migration Guide

## ✅ Supabase Credentials Configured

- **URL:** `https://gpcxowqljayhkxyybfqu.supabase.co`
- **Anon Key:** Configured in `.env.local`
- **Service Role Key:** Configured in `.env.local`

## 📋 Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu/sql
   ```

2. **Run migrations in order:**
   
   **Step 1: Schema**
   - Copy content from `supabase/schema.sql`
   - Paste in SQL Editor
   - Click "Run"

   **Step 2: Policies**
   - Copy content from `supabase/policies.sql`
   - Paste in SQL Editor
   - Click "Run"

   **Step 3: Seed Data**
   - Copy content from `supabase/seed.sql`
   - Paste in SQL Editor
   - Click "Run"

### Option 2: Using psql (if you have direct database access)

```bash
# Connect to Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.gpcxowqljayhkxyybfqu.supabase.co:5432/postgres"

# Run migrations
\i supabase/schema.sql
\i supabase/policies.sql
\i supabase/seed.sql
```

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref gpcxowqljayhkxyybfqu

# Apply migrations
supabase db push
```

## 📝 Migration Files

1. **`supabase/schema.sql`** - Creates all tables
   - `patients`
   - `specialists`
   - `sessions`
   - `admins`
   - `cms_content`

2. **`supabase/policies.sql`** - Sets up Row Level Security (RLS)
   - Enables RLS on all tables
   - Creates access policies

3. **`supabase/seed.sql`** - Inserts initial data
   - 3 specialists
   - 3 sample patients

## ✅ Verification

After running migrations, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check seed data
SELECT COUNT(*) FROM specialists;
SELECT COUNT(*) FROM patients;
```

Expected results:
- 5 tables created
- RLS enabled on all tables
- 3 specialists
- 3 patients

## 🔗 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu
- **SQL Editor:** https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu/sql
- **Table Editor:** https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu/editor

## ⚠️ Important Notes

1. **Run migrations in order:** schema → policies → seed
2. **Service Role Key:** Use only for server-side operations
3. **Anon Key:** Safe for client-side use (with RLS)
4. **Backup:** Consider backing up data before migrations

## 🚀 Next Steps

After migrations:
1. ✅ Verify tables created
2. ✅ Verify RLS policies active
3. ✅ Verify seed data inserted
4. ✅ Test API endpoints
5. ✅ Update n8n workflows with Supabase credentials

