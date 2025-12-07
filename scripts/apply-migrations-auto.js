#!/usr/bin/env node

/**
 * Auto-apply Database Migrations
 * Uses PostgreSQL connection to apply migrations automatically
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

// Build connection string from Supabase URL if DATABASE_URL is not provided
function getConnectionString() {
  if (DATABASE_URL) {
    return DATABASE_URL
  }

  // Try to extract database connection info from Supabase URL
  // Format: https://[project-ref].supabase.co
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)
    if (urlMatch) {
      const projectRef = urlMatch[1]
      
      // Supabase connection string format:
      // postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
      // But we need the direct connection string, not the pooler
      
      // Alternative: Use Supabase's direct connection
      // We'll need the database password from environment or use service role
      const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD
      const dbHost = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`
      const dbPort = process.env.SUPABASE_DB_PORT || '5432'
      const dbName = process.env.SUPABASE_DB_NAME || 'postgres'
      const dbUser = process.env.SUPABASE_DB_USER || 'postgres'

      if (dbPassword) {
        return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=require`
      }
    }
  }

  return null
}

async function applyMigrationsAuto() {
  console.log('🚀 Starting automatic migration application...\n')

  const connectionString = getConnectionString()

  if (!connectionString) {
    console.error('❌ Missing database connection information')
    console.error('\nRequired one of:')
    console.error('  - DATABASE_URL (PostgreSQL connection string)')
    console.error('  - SUPABASE_DB_URL')
    console.error('  - SUPABASE_DB_PASSWORD (with NEXT_PUBLIC_SUPABASE_URL)')
    console.error('\n💡 To get your Supabase connection string:')
    console.error('   1. Go to Supabase Dashboard > Settings > Database')
    console.error('   2. Copy the "Connection string" (URI mode)')
    console.error('   3. Add it to .env.local as DATABASE_URL')
    console.error('\n   Or set SUPABASE_DB_PASSWORD in .env.local')
    process.exit(1)
  }

  // Mask password in logs
  const maskedConnection = connectionString.replace(/:[^:@]+@/, ':****@')
  console.log(`📦 Database: ${maskedConnection}\n`)

  const migrations = [
    '001_create_users_table.sql',
    '002_create_knowledge_base_table.sql',
    '003_update_content_items_table.sql'
  ]

  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir)
    process.exit(1)
  }

  const client = new Client({ connectionString })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully!\n')

    let successCount = 0
    let errorCount = 0

    for (const migrationFile of migrations) {
      const filePath = path.join(migrationsDir, migrationFile)
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Migration file not found: ${migrationFile}`)
        continue
      }

      try {
        const sql = fs.readFileSync(filePath, 'utf-8')
        console.log(`📄 Applying: ${migrationFile}`)

        // Execute the entire SQL file
        await client.query(sql)
        
        console.log(`✅ ${migrationFile} applied successfully\n`)
        successCount++
      } catch (error) {
        // Check if error is because table/object already exists
        if (error.message.includes('already exists') || 
            error.code === '42P07' || // duplicate_table
            error.code === '42710') { // duplicate_object
          console.log(`⚠️  ${migrationFile}: Some objects already exist (skipping)\n`)
          successCount++
        } else {
          console.error(`❌ Error applying ${migrationFile}:`, error.message)
          console.error(`   Code: ${error.code}\n`)
          errorCount++
        }
      }
    }

    // Verify migrations
    console.log('🔍 Verifying migrations...\n')
    
    const verifyQueries = [
      { name: 'users table', query: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')" },
      { name: 'knowledge_base table', query: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_base')" },
      { name: 'content_items table', query: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_items')" }
    ]

    for (const verify of verifyQueries) {
      try {
        const result = await client.query(verify.query)
        const exists = result.rows[0].exists
        console.log(`${exists ? '✅' : '❌'} ${verify.name}: ${exists ? 'exists' : 'missing'}`)
      } catch (error) {
        console.error(`❌ Error verifying ${verify.name}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migrations completed!`)
    console.log(`   Success: ${successCount}/${migrations.length}`)
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount}`)
    }
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Database connection error:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check your DATABASE_URL or connection credentials')
    console.error('   2. Ensure your IP is allowed in Supabase (Settings > Database > Connection Pooling)')
    console.error('   3. For Supabase, use the "Connection string" from Settings > Database')
    console.error('   4. Make sure SSL is enabled (add ?sslmode=require to connection string)')
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

applyMigrationsAuto().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
