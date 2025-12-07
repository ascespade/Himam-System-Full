#!/usr/bin/env node

/**
 * Cleanup Applied Migrations
 * Deletes migration files that have been successfully applied
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

async function cleanupAppliedMigrations() {
  if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL or SUPABASE_DB_URL')
    process.exit(1)
  }

  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    console.log('🔌 Connected to database\n')

    // Check which tables exist
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'users', 'knowledge_base', 'content_items',
        'medical_records', 'diagnoses', 'prescriptions', 
        'lab_results', 'imaging_results', 'vital_signs',
        'doctor_profiles', 'doctor_patient_relationships',
        'insurance_claims', 'reception_queue',
        'slack_conversations', 'slack_messages',
        'notifications', 'appointment_reminders', 'audit_logs',
        'file_attachments', 'prescription_items', 'doctor_schedules',
        'appointment_slots', 'payment_transactions', 'invoices',
        'patient_consents', 'referrals', 'vaccinations',
        'medications', 'patient_allergies', 'patient_chronic_conditions'
      )
      ORDER BY table_name
    `)

    const existingTables = new Set(tables.map(t => t.table_name))
    console.log('✅ Found tables:', Array.from(existingTables).join(', '))
    console.log('')

    // Determine which migrations are applied
    const migrationsDir = path.join(__dirname, '../supabase/migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f !== 'apply_all_migrations.sql')
      .sort()

    const appliedMigrations = []

    // Check 001 - users table
    if (existingTables.has('users')) {
      appliedMigrations.push('001_create_users_table.sql')
    }

    // Check 002 - knowledge_base table
    if (existingTables.has('knowledge_base')) {
      appliedMigrations.push('002_create_knowledge_base_table.sql')
    }

    // Check 003 - content_items table (updated)
    if (existingTables.has('content_items')) {
      appliedMigrations.push('003_update_content_items_table.sql')
    }

    // Check 004 - medical records system
    if (existingTables.has('medical_records') && 
        existingTables.has('diagnoses') && 
        existingTables.has('prescriptions') &&
        existingTables.has('doctor_profiles')) {
      appliedMigrations.push('004_create_medical_records_system.sql')
    }

    // Check 005 - complete missing tables
    if (existingTables.has('notifications') && 
        existingTables.has('appointment_reminders') && 
        existingTables.has('audit_logs') &&
        existingTables.has('file_attachments') &&
        existingTables.has('prescription_items') &&
        existingTables.has('doctor_schedules') &&
        existingTables.has('appointment_slots') &&
        existingTables.has('payment_transactions') &&
        existingTables.has('invoices') &&
        existingTables.has('patient_consents') &&
        existingTables.has('referrals') &&
        existingTables.has('vaccinations') &&
        existingTables.has('medications') &&
        existingTables.has('patient_allergies') &&
        existingTables.has('patient_chronic_conditions')) {
      appliedMigrations.push('005_complete_missing_tables.sql')
    }

    console.log('📋 Applied migrations:', appliedMigrations.join(', '))
    console.log('')

    if (appliedMigrations.length === 0) {
      console.log('⚠️  No migrations to delete')
      await client.end()
      return
    }

    // Delete applied migration files
    console.log('🗑️  Deleting applied migration files...')
    for (const migrationFile of appliedMigrations) {
      const filePath = path.join(migrationsDir, migrationFile)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`   ✅ Deleted: ${migrationFile}`)
      }
    }

    console.log('')
    console.log('✅ Cleanup complete!')
    console.log(`   Deleted ${appliedMigrations.length} migration file(s)`)

    await client.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    await client.end()
    process.exit(1)
  }
}

cleanupAppliedMigrations()

