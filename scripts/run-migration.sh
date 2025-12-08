#!/bin/bash

# Script to run database migration
# Usage: ./scripts/run-migration.sh [migration_file]

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set"
  exit 1
fi

MIGRATION_FILE=${1:-"supabase/migrations/20250117000000_enhance_reception_module.sql"}

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "Running migration: $MIGRATION_FILE"
echo "Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"

# Run migration using psql
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully"
  
  # Delete migration file after successful execution
  echo "Deleting migration file..."
  rm "$MIGRATION_FILE"
  echo "✅ Migration file deleted"
else
  echo "❌ Migration failed"
  exit 1
fi
