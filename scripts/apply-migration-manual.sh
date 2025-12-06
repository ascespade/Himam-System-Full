#!/bin/bash

# Script to apply migration manually using Supabase CLI or direct SQL

MIGRATION_FILE="supabase/migrations/001_create_dynamic_content_tables.sql"

echo "📦 Applying database migration..."
echo ""

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📝 Migration file: $MIGRATION_FILE"
echo ""
echo "Please apply this migration using one of the following methods:"
echo ""
echo "Method 1: Supabase Dashboard"
echo "  1. Go to Supabase Dashboard > SQL Editor"
echo "  2. Copy and paste the contents of $MIGRATION_FILE"
echo "  3. Click 'Run'"
echo ""
echo "Method 2: Supabase CLI"
echo "  supabase db push"
echo ""
echo "Method 3: Direct psql connection"
echo "  psql 'your-connection-string' < $MIGRATION_FILE"
echo ""
echo "After migration is applied, run:"
echo "  npm run migration:cleanup"
echo ""

