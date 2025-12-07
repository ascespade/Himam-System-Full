/**
 * Apply Migrations using API Endpoint
 * This script calls the migration API to get SQL and provides instructions
 */

const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN || 'dev-token-12345'

const migrations = [
  '001_create_users_table.sql',
  '002_create_knowledge_base_table.sql',
  '003_update_content_items_table.sql'
]

async function applyMigrations() {
  console.log('🚀 Starting migration process...\n')
  console.log(`📦 Supabase URL: ${SUPABASE_URL || 'Not configured'}\n`)

  if (!SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
    console.log('\n📝 Please set up your environment variables first')
    process.exit(1)
  }

  // Read migrations directly from files
  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir)
    process.exit(1)
  }

  console.log('📄 Reading migration files...\n')

  const allSQL = []

  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration)
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Migration file not found: ${migration}`)
      continue
    }

    try {
      const sql = fs.readFileSync(filePath, 'utf-8')
      allSQL.push({
        file: migration,
        sql: sql.trim()
      })
      console.log(`✅ Read: ${migration}`)
    } catch (error) {
      console.error(`❌ Error reading ${migration}:`, error.message)
    }
  }

  if (allSQL.length === 0) {
    console.error('❌ No migrations found')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 MIGRATION SQL TO APPLY')
  console.log('='.repeat(60))
  console.log('\n⚠️  IMPORTANT: Supabase doesn\'t support raw SQL execution via JS client.')
  console.log('   You need to apply these migrations manually in Supabase SQL Editor.\n')
  console.log('📝 Steps:')
  console.log('   1. Go to: https://supabase.com/dashboard/project/[your-project]/sql')
  console.log('   2. Copy and paste each migration SQL below')
  console.log('   3. Execute them in order\n')
  console.log('='.repeat(60) + '\n')

  // Output all SQL
  for (let i = 0; i < allSQL.length; i++) {
    const migration = allSQL[i]
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📄 Migration ${i + 1}/${allSQL.length}: ${migration.file}`)
    console.log('─'.repeat(60))
    console.log(migration.sql)
    console.log('\n')
  }

  console.log('='.repeat(60))
  console.log('✅ All migrations prepared')
  console.log('='.repeat(60))
  console.log('\n💡 Tip: You can also use the Supabase CLI:')
  console.log('   supabase db push\n')
}

applyMigrations().catch(console.error)

