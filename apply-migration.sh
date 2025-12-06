#!/bin/bash

# Supabase Migration Script
# This script applies database migrations to Supabase

SUPABASE_URL="https://gpcxowqljayhkxyybfqu.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY3hvd3FsamF5aGt4eXliZnF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgxNTEyMCwiZXhwIjoyMDc0MzkxMTIwfQ.lKbCOs_VK04dl5uuwIy4X86h39fn3t_hweT20v5n2PY"

echo "🚀 Applying Supabase migrations..."

# Apply schema
echo "📋 Step 1: Applying schema..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d @supabase/schema.sql 2>/dev/null || echo "⚠️  Schema: Run manually in Supabase SQL Editor"

# Apply policies
echo "🔒 Step 2: Applying RLS policies..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d @supabase/policies.sql 2>/dev/null || echo "⚠️  Policies: Run manually in Supabase SQL Editor"

# Apply seed data
echo "🌱 Step 3: Applying seed data..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d @supabase/seed.sql 2>/dev/null || echo "⚠️  Seed: Run manually in Supabase SQL Editor"

echo ""
echo "✅ Migration script completed!"
echo "📝 Note: If curl failed, run the SQL files manually in Supabase SQL Editor:"
echo "   1. Go to: https://supabase.com/dashboard/project/gpcxowqljayhkxyybfqu/sql"
echo "   2. Run: supabase/schema.sql"
echo "   3. Run: supabase/policies.sql"
echo "   4. Run: supabase/seed.sql"
