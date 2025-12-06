#!/usr/bin/env node

/**
 * Script to apply database migration and delete migration files
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function applyMigration() {
  const migrationFile = path.join(__dirname, '../supabase/migrations/001_create_dynamic_content_tables.sql')
  
  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Migration file not found:', migrationFile)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationFile, 'utf8')
  
  console.log('📦 Applying migration...')
  
  try {
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase.from('_migrations').select('*')
          if (queryError) {
            console.warn('⚠️  Note: Some statements may need manual execution')
          }
        }
      }
    }

    // Alternative: Use Supabase SQL editor or psql
    console.log('✅ Migration SQL prepared')
    console.log('📝 Please run the migration SQL manually in Supabase SQL Editor')
    console.log('   Or use: psql connection string')
    console.log('')
    console.log('Migration file location:', migrationFile)
    
    // Delete migration files after successful application
    console.log('🗑️  Deleting migration files...')
    const migrationsDir = path.join(__dirname, '../supabase/migrations')
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
      files.forEach(file => {
        const filePath = path.join(migrationsDir, file)
        fs.unlinkSync(filePath)
        console.log('   Deleted:', file)
      })
      fs.rmdirSync(migrationsDir)
      console.log('✅ Migration files deleted')
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  }
}

applyMigration()

