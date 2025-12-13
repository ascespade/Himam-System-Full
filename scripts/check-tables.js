#!/usr/bin/env node

const { Client } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

async function checkTables() {
  if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL')
    process.exit(1)
  }

  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    console.log('🔌 Connected to database\n')

    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'notifications', 'appointment_reminders', 'audit_logs', 
        'file_attachments', 'prescription_items', 'doctor_schedules', 
        'appointment_slots', 'payment_transactions', 'invoices', 
        'patient_consents', 'referrals', 'vaccinations', 
        'medications', 'patient_allergies', 'patient_chronic_conditions'
      )
      ORDER BY table_name
    `)

    const foundTables = rows.map(r => r.table_name)
    console.log('✅ Found tables:', foundTables.join(', '))
    console.log(`\n📊 Total: ${foundTables.length}/15 tables`)

    const expectedTables = [
      'notifications', 'appointment_reminders', 'audit_logs', 
      'file_attachments', 'prescription_items', 'doctor_schedules', 
      'appointment_slots', 'payment_transactions', 'invoices', 
      'patient_consents', 'referrals', 'vaccinations', 
      'medications', 'patient_allergies', 'patient_chronic_conditions'
    ]

    const missing = expectedTables.filter(t => !foundTables.includes(t))
    if (missing.length > 0) {
      console.log('\n⚠️  Missing tables:', missing.join(', '))
    } else {
      console.log('\n✅ All tables from migration 005 are present!')
    }

    await client.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    await client.end()
    process.exit(1)
  }
}

checkTables()








