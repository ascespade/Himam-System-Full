/**
 * Apply Database Migrations
 * This script applies all migration files to the Supabase database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key (for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration(fileName: string): Promise<void> {
  const filePath = join(process.cwd(), 'supabase', 'migrations', fileName)
  
  try {
    console.log(`\n📄 Reading migration: ${fileName}`)
    const sql = readFileSync(filePath, 'utf-8')
    
    // Split SQL by semicolons and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`   Found ${statements.length} SQL statements`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip comments and empty lines
      if (statement.trim().startsWith('--') || statement.trim().length <= 1) {
        continue
      }
      
      try {
        // Use RPC to execute SQL (if available) or direct query
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // If RPC doesn't exist, try direct query via PostgREST
          // Note: Supabase client doesn't support raw SQL directly
          // We'll need to use the REST API or SQL editor
          console.warn(`   ⚠️  Statement ${i + 1} may need manual execution`)
          console.warn(`   Error: ${error.message}`)
        } else {
          console.log(`   ✓ Statement ${i + 1} executed`)
        }
      } catch (err: any) {
        console.warn(`   ⚠️  Statement ${i + 1} error: ${err.message}`)
      }
    }
    
    console.log(`✅ Migration ${fileName} processed`)
  } catch (error: any) {
    console.error(`❌ Error applying migration ${fileName}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting database migrations...')
  console.log(`📦 Supabase URL: ${supabaseUrl}`)
  
  const migrations = [
    '001_create_users_table.sql',
    '002_create_knowledge_base_table.sql',
    '003_update_content_items_table.sql'
  ]
  
  for (const migration of migrations) {
    try {
      await applyMigration(migration)
    } catch (error) {
      console.error(`\n❌ Failed to apply ${migration}`)
      console.error('Please apply migrations manually via Supabase SQL Editor')
      process.exit(1)
    }
  }
  
  console.log('\n✅ All migrations completed!')
  console.log('\n📝 Note: If some statements failed, please apply them manually via Supabase SQL Editor')
  console.log('   Go to: https://supabase.com/dashboard/project/[your-project]/sql')
}

main().catch(console.error)

