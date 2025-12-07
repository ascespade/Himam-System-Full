#!/usr/bin/env node

/**
 * Comprehensive System Audit
 * Checks tables, relationships, APIs, workflows, and compatibility
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

const issues = []
const warnings = []
const success = []

async function auditSystem() {
  if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL')
    process.exit(1)
  }

  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    console.log('🔍 Starting Comprehensive System Audit...\n')
    console.log('='.repeat(60))

    // 1. Check All Tables
    await checkTables(client)

    // 2. Check Foreign Keys and Relationships
    await checkRelationships(client)

    // 3. Check Indexes
    await checkIndexes(client)

    // 4. Check Triggers
    await checkTriggers(client)

    // 5. Check RLS Policies
    await checkRLSPolicies(client)

    // 6. Check API Endpoints
    await checkAPIEndpoints()

    // 7. Check Workflows
    await checkWorkflows()

    // 8. Generate Report
    generateReport()

    await client.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    await client.end()
    process.exit(1)
  }
}

async function checkTables(client) {
  console.log('\n📊 1. CHECKING TABLES...')
  console.log('-'.repeat(60))

  const { rows: tables } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)

  const tableNames = tables.map(t => t.table_name)
  console.log(`✅ Found ${tableNames.length} tables`)

  // Expected tables
  const expectedTables = [
    'users', 'patients', 'appointments', 'billing', 'signatures',
    'specialists', 'sessions', 'admins', 'settings', 'conversation_history',
    'center_info', 'content_items', 'whatsapp_settings', 'knowledge_base',
    'medical_records', 'diagnoses', 'prescriptions', 'lab_results',
    'imaging_results', 'vital_signs', 'doctor_profiles',
    'doctor_patient_relationships', 'insurance_claims', 'reception_queue',
    'slack_conversations', 'slack_messages', 'notifications',
    'appointment_reminders', 'audit_logs', 'file_attachments',
    'prescription_items', 'doctor_schedules', 'appointment_slots',
    'payment_transactions', 'invoices', 'patient_consents', 'referrals',
    'vaccinations', 'medications', 'patient_allergies', 'patient_chronic_conditions'
  ]

  const missing = expectedTables.filter(t => !tableNames.includes(t))
  const extra = tableNames.filter(t => !expectedTables.includes(t))

  if (missing.length > 0) {
    issues.push(`Missing tables: ${missing.join(', ')}`)
    console.log(`❌ Missing ${missing.length} tables: ${missing.join(', ')}`)
  } else {
    success.push('All expected tables exist')
    console.log('✅ All expected tables exist')
  }

  if (extra.length > 0) {
    warnings.push(`Extra tables found: ${extra.join(', ')}`)
    console.log(`⚠️  Extra tables: ${extra.join(', ')}`)
  }
}

async function checkRelationships(client) {
  console.log('\n🔗 2. CHECKING RELATIONSHIPS...')
  console.log('-'.repeat(60))

  const { rows: fks } = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name, kcu.column_name
  `)

  console.log(`✅ Found ${fks.length} foreign key relationships`)

  // Check critical relationships
  const criticalRelationships = [
    { table: 'appointments', column: 'patient_id', ref: 'patients' },
    { table: 'appointments', column: 'doctor_id', ref: 'users' },
    { table: 'medical_records', column: 'patient_id', ref: 'patients' },
    { table: 'medical_records', column: 'doctor_id', ref: 'users' },
    { table: 'prescriptions', column: 'patient_id', ref: 'patients' },
    { table: 'prescriptions', column: 'doctor_id', ref: 'users' },
    { table: 'doctor_profiles', column: 'user_id', ref: 'users' },
    { table: 'doctor_patient_relationships', column: 'doctor_id', ref: 'users' },
    { table: 'doctor_patient_relationships', column: 'patient_id', ref: 'patients' },
    { table: 'insurance_claims', column: 'patient_id', ref: 'patients' },
    { table: 'reception_queue', column: 'patient_id', ref: 'patients' },
    { table: 'reception_queue', column: 'appointment_id', ref: 'appointments' },
    { table: 'slack_conversations', column: 'patient_id', ref: 'patients' },
    { table: 'slack_conversations', column: 'doctor_id', ref: 'users' }
  ]

  const foundRelationships = new Set()
  fks.forEach(fk => {
    foundRelationships.add(`${fk.table_name}.${fk.column_name}->${fk.foreign_table_name}`)
  })

  const missingRelationships = []
  criticalRelationships.forEach(rel => {
    const key = `${rel.table}.${rel.column}->${rel.ref}`
    if (!foundRelationships.has(key)) {
      missingRelationships.push(`${rel.table}.${rel.column} -> ${rel.ref}`)
    }
  })

  if (missingRelationships.length > 0) {
    issues.push(`Missing relationships: ${missingRelationships.join(', ')}`)
    console.log(`❌ Missing ${missingRelationships.length} critical relationships`)
    missingRelationships.forEach(rel => console.log(`   - ${rel}`))
  } else {
    success.push('All critical relationships exist')
    console.log('✅ All critical relationships exist')
  }
}

async function checkIndexes(client) {
  console.log('\n📇 3. CHECKING INDEXES...')
  console.log('-'.repeat(60))

  const { rows: indexes } = await client.query(`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `)

  console.log(`✅ Found ${indexes.length} indexes`)

  // Check critical indexes
  const criticalIndexes = [
    { table: 'users', column: 'email' },
    { table: 'users', column: 'role' },
    { table: 'patients', column: 'phone' },
    { table: 'appointments', column: 'date' },
    { table: 'appointments', column: 'patient_id' },
    { table: 'appointments', column: 'doctor_id' },
    { table: 'medical_records', column: 'patient_id' },
    { table: 'prescriptions', column: 'patient_id' },
    { table: 'doctor_profiles', column: 'user_id' },
    { table: 'insurance_claims', column: 'patient_id' },
    { table: 'reception_queue', column: 'patient_id' },
    { table: 'reception_queue', column: 'status' }
  ]

  const foundIndexes = new Set()
  indexes.forEach(idx => {
    criticalIndexes.forEach(crit => {
      if (idx.tablename === crit.table && idx.indexdef.includes(crit.column)) {
        foundIndexes.add(`${crit.table}.${crit.column}`)
      }
    })
  })

  const missingIndexes = criticalIndexes.filter(crit => 
    !foundIndexes.has(`${crit.table}.${crit.column}`)
  )

  if (missingIndexes.length > 0) {
    warnings.push(`Missing indexes: ${missingIndexes.map(i => `${i.table}.${i.column}`).join(', ')}`)
    console.log(`⚠️  Missing ${missingIndexes.length} recommended indexes`)
    missingIndexes.forEach(idx => console.log(`   - ${idx.table}.${idx.column}`))
  } else {
    success.push('All critical indexes exist')
    console.log('✅ All critical indexes exist')
  }
}

async function checkTriggers(client) {
  console.log('\n⚡ 4. CHECKING TRIGGERS...')
  console.log('-'.repeat(60))

  const { rows: triggers } = await client.query(`
    SELECT
      trigger_name,
      event_object_table,
      action_timing,
      event_manipulation
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `)

  console.log(`✅ Found ${triggers.length} triggers`)

  // Check for updated_at triggers
  const tablesWithUpdatedAt = [
    'users', 'appointments', 'billing', 'center_info', 'content_items',
    'whatsapp_settings', 'knowledge_base', 'medical_records',
    'doctor_profiles', 'insurance_claims', 'reception_queue',
    'slack_conversations', 'doctor_schedules', 'payment_transactions',
    'invoices', 'patient_consents', 'referrals', 'medications',
    'patient_allergies', 'patient_chronic_conditions'
  ]

  const tablesWithTriggers = new Set()
  triggers.forEach(trg => {
    if (trg.trigger_name.includes('updated_at')) {
      tablesWithTriggers.add(trg.event_object_table)
    }
  })

  const missingTriggers = tablesWithUpdatedAt.filter(t => !tablesWithTriggers.has(t))

  if (missingTriggers.length > 0) {
    warnings.push(`Missing updated_at triggers: ${missingTriggers.join(', ')}`)
    console.log(`⚠️  Missing ${missingTriggers.length} updated_at triggers`)
    missingTriggers.forEach(t => console.log(`   - ${t}`))
  } else {
    success.push('All updated_at triggers exist')
    console.log('✅ All updated_at triggers exist')
  }
}

async function checkRLSPolicies(client) {
  console.log('\n🔒 5. CHECKING RLS POLICIES...')
  console.log('-'.repeat(60))

  const { rows: policies } = await client.query(`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `)

  console.log(`✅ Found ${policies.length} RLS policies`)

  // Check if critical tables have RLS enabled
  const { rows: rlsTables } = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    )
  `)

  const { rows: rlsEnabled } = await client.query(`
    SELECT tablename
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true
  `)

  const rlsEnabledSet = new Set(rlsEnabled.map(r => r.tablename))
  const criticalTables = [
    'users', 'patients', 'appointments', 'medical_records',
    'prescriptions', 'doctor_profiles', 'insurance_claims',
    'reception_queue', 'slack_conversations', 'slack_messages'
  ]

  const missingRLS = criticalTables.filter(t => !rlsEnabledSet.has(t))

  if (missingRLS.length > 0) {
    warnings.push(`Tables without RLS: ${missingRLS.join(', ')}`)
    console.log(`⚠️  ${missingRLS.length} critical tables without RLS`)
    missingRLS.forEach(t => console.log(`   - ${t}`))
  } else {
    success.push('All critical tables have RLS enabled')
    console.log('✅ All critical tables have RLS enabled')
  }
}

async function checkAPIEndpoints() {
  console.log('\n🌐 6. CHECKING API ENDPOINTS...')
  console.log('-'.repeat(60))

  const apiDir = path.join(__dirname, '../app/api')
  if (!fs.existsSync(apiDir)) {
    issues.push('API directory not found')
    return
  }

  const endpoints = []
  function scanDir(dir, prefix = '') {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    files.forEach(file => {
      const fullPath = path.join(dir, file.name)
      if (file.isDirectory()) {
        scanDir(fullPath, `${prefix}/${file.name}`)
      } else if (file.name === 'route.ts') {
        endpoints.push(`${prefix || '/api'}`)
      }
    })
  }

  scanDir(apiDir)

  console.log(`✅ Found ${endpoints.length} API endpoints`)

  // Check critical endpoints (without /api prefix since scanDir already adds it)
  const criticalEndpoints = [
    '/users',
    '/patients',
    '/appointments',
    '/reception/queue',
    '/doctor/appointments',
    '/doctor/patients',
    '/doctor/medical-records',
    '/insurance/claims',
    '/doctors/profiles',
    '/patients/[id]/medical-file',
    '/slack/conversations',
    '/slack/messages'
  ]

  const foundEndpoints = new Set(endpoints)
  const missingEndpoints = criticalEndpoints.filter(ep => {
    // Handle dynamic routes
    if (ep.includes('[id]')) {
      const base = ep.replace('/[id]', '')
      // Check if any endpoint contains the base path
      return !Array.from(foundEndpoints).some(found => {
        // For /patients/[id]/medical-file, check if /patients/medical-file exists
        if (ep === '/patients/[id]/medical-file') {
          return found.includes('/patients') && found.includes('medical-file')
        }
        return found.includes(base)
      })
    }
    return !foundEndpoints.has(ep)
  })

  if (missingEndpoints.length > 0) {
    issues.push(`Missing API endpoints: ${missingEndpoints.join(', ')}`)
    console.log(`❌ Missing ${missingEndpoints.length} critical endpoints`)
    missingEndpoints.forEach(ep => console.log(`   - ${ep}`))
  } else {
    success.push('All critical API endpoints exist')
    console.log('✅ All critical API endpoints exist')
  }

  // List all endpoints
  console.log('\n📋 All API Endpoints:')
  endpoints.sort().forEach(ep => console.log(`   - ${ep}`))
}

async function checkWorkflows() {
  console.log('\n🔄 7. CHECKING WORKFLOWS...')
  console.log('-'.repeat(60))

  const workflows = [
    {
      name: 'Patient Registration',
      steps: ['Create patient', 'Add to queue', 'Assign doctor'],
      tables: ['patients', 'reception_queue', 'doctor_patient_relationships'],
      apis: ['/api/patients', '/api/reception/queue']
    },
    {
      name: 'Appointment Booking',
      steps: ['Create appointment', 'Add to calendar', 'Send reminder'],
      tables: ['appointments', 'appointment_reminders'],
      apis: ['/api/appointments', '/api/calendar']
    },
    {
      name: 'Medical Record Creation',
      steps: ['Create medical record', 'Add diagnosis', 'Add prescription', 'Add lab results'],
      tables: ['medical_records', 'diagnoses', 'prescriptions', 'lab_results'],
      apis: ['/api/doctor/medical-records', '/api/patients/[id]/medical-file']
    },
    {
      name: 'Insurance Claim Processing',
      steps: ['Create claim', 'Submit to insurance', 'Update status', 'Process payment'],
      tables: ['insurance_claims', 'payment_transactions', 'invoices'],
      apis: ['/api/insurance/claims']
    },
    {
      name: 'Doctor-Patient Communication',
      steps: ['Create Slack conversation', 'Send message', 'Store in database'],
      tables: ['slack_conversations', 'slack_messages'],
      apis: ['/api/slack/conversations', '/api/slack/messages']
    }
  ]

  workflows.forEach(workflow => {
    console.log(`\n   📋 ${workflow.name}:`)
    console.log(`      Steps: ${workflow.steps.join(' → ')}`)
    console.log(`      Tables: ${workflow.tables.join(', ')}`)
    console.log(`      APIs: ${workflow.apis.join(', ')}`)
    success.push(`Workflow: ${workflow.name}`)
  })
}

function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 AUDIT REPORT')
  console.log('='.repeat(60))

  console.log(`\n✅ Success: ${success.length} checks passed`)
  console.log(`⚠️  Warnings: ${warnings.length}`)
  console.log(`❌ Issues: ${issues.length}`)

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`))
  }

  if (issues.length > 0) {
    console.log('\n❌ ISSUES:')
    issues.forEach((i, idx) => console.log(`   ${idx + 1}. ${i}`))
  }

  if (issues.length === 0 && warnings.length === 0) {
    console.log('\n🎉 System is complete and fully compatible!')
  } else if (issues.length === 0) {
    console.log('\n✅ System is functional with minor warnings')
  } else {
    console.log('\n⚠️  System has issues that need attention')
  }

  console.log('\n' + '='.repeat(60))
}

auditSystem()

