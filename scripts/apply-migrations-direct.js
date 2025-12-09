/**
 * Apply migrations directly to database
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

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
      .filter(f => f.endsWith('.sql'))
      .sort()

    console.log(`📦 Found ${files.length} migration files`)

    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      
      console.log(`\n🔄 Applying: ${file}`)
      
      try {
        await client.query(sql)
        console.log(`✅ Applied: ${file}`)
      } catch (error) {
        // Check if error is about already existing objects
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`⚠️  Skipped (already exists): ${file}`)
        } else {
          console.error(`❌ Error applying ${file}:`, error.message)
          throw error
        }
      }
    }

    console.log('\n✅ All migrations applied successfully!')
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyMigrations()
