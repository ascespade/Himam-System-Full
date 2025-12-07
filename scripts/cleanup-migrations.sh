#!/bin/bash

# Script to delete migration files after successful application

MIGRATIONS_DIR="supabase/migrations"

echo "🗑️  Cleaning up migration files..."

if [ -d "$MIGRATIONS_DIR" ]; then
  echo "Deleting migration files from $MIGRATIONS_DIR..."
  rm -rf "$MIGRATIONS_DIR"
  echo "✅ Migration files deleted"
else
  echo "⚠️  Migrations directory not found (may already be deleted)"
fi

echo ""
echo "✅ Cleanup complete!"

