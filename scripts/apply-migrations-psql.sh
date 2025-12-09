#!/bin/bash

DATABASE_URL="postgresql://postgres.gpcxowqljayhkxyybfqu:LHiA1NpxJVHZyOf4@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

MIGRATIONS_DIR="./supabase/migrations"

echo "🔄 Applying migrations..."

for migration_file in $(ls -1 $MIGRATIONS_DIR/*.sql | sort); do
    echo "📦 Applying: $(basename $migration_file)"
    PGPASSWORD=$(echo $DATABASE_URL | grep -oP ':[^:@]+@' | sed 's/[:@]//g') psql "$DATABASE_URL" -f "$migration_file" 2>&1 | grep -v "already exists" | grep -v "duplicate" || echo "✅ Applied or skipped: $(basename $migration_file)"
done

echo "✅ Migrations completed!"
