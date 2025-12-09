/**
 * Apply migrations using PostgreSQL client
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Extract connection details from DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.gpcxowqljayhkxyybfqu:LHiA1NpxJVHZyOf4@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

async function applyMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    const migrationsDir = path.join(__dirname, '../supabase/migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f.startsWith('20251209'))
      .sort()

    console.log(`📦 Found ${files.length} migration files to apply`)

    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      
      console.log(`\n🔄 Applying: ${file}`)
      
      try {
        await client.query(sql)
        console.log(`✅ Successfully applied: ${file}`)
      } catch (error) {
        // Check if error is about already existing objects
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            (errorMsg.includes('relation') && errorMsg.includes('already exists')) ||
            errorMsg.includes('constraint') && errorMsg.includes('already exists')) {
          console.log(`⚠️  Skipped (already exists): ${file}`)
        } else {
          console.error(`❌ Error applying ${file}:`, error.message)
          // Continue with other migrations
        }
      }
    }

    console.log('\n✅ Migration process completed!')
  } catch (error) {
    console.error('❌ Connection error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyMigrations()
