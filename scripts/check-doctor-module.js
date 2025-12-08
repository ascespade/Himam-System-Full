/**
 * Doctor Module Tables Checker
 * يتحقق من وجود جميع الجداول المطلوبة لموديول الطبيب
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// الجداول المطلوبة لموديول الطبيب
const requiredTables = [
  // Core doctor tables
  { name: 'doctor_profiles', description: 'بروفايلات الأطباء', critical: true },
  { name: 'doctor_patient_relationships', description: 'علاقات الأطباء بالمرضى', critical: true },
  { name: 'doctor_schedules', description: 'جداول عمل الأطباء', critical: true },
  
  // Optional but recommended
  { name: 'doctor_notes_templates', description: 'قوالب ملاحظات الأطباء', critical: false },
  { name: 'doctor_performance_metrics', description: 'مقاييس أداء الأطباء', critical: false },
  
  // Related tables
  { name: 'patients', description: 'المرضى', critical: true },
  { name: 'users', description: 'المستخدمين', critical: true },
  { name: 'appointments', description: 'المواعيد', critical: true },
  { name: 'medical_records', description: 'السجلات الطبية', critical: true },
  { name: 'sessions', description: 'الجلسات', critical: true },
  
  // Optional tables
  { name: 'patient_visits', description: 'زيارات المرضى', critical: false },
  { name: 'reception_queue', description: 'طابور الاستقبال', critical: false },
]

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { exists: false, error: 'Table does not exist' }
      }
      return { exists: false, error: error.message }
    }

    return { exists: true, rowCount: data?.length || 0 }
  } catch (err) {
    return { exists: false, error: err.message }
  }
}

async function checkDoctorModule() {
  console.log('🔍 فحص موديول الطبيب...\n')
  console.log('='.repeat(60))

  const results = []
  let criticalMissing = 0
  let optionalMissing = 0

  for (const table of requiredTables) {
    const result = await checkTable(table.name)
    const status = result.exists ? '✅' : (table.critical ? '❌' : '⚠️')
    
    results.push({
      ...table,
      ...result,
      status
    })

    if (!result.exists) {
      if (table.critical) {
        criticalMissing++
      } else {
        optionalMissing++
      }
    }

    console.log(`${status} ${table.name.padEnd(35)} - ${table.description}`)
    if (result.exists && result.rowCount !== undefined) {
      console.log(`   ${result.rowCount} rows`)
    } else if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 ملخص النتائج:')
  console.log(`✅ الجداول الموجودة: ${results.filter(r => r.exists).length}/${requiredTables.length}`)
  console.log(`❌ الجداول الحرجة المفقودة: ${criticalMissing}`)
  console.log(`⚠️  الجداول الاختيارية المفقودة: ${optionalMissing}`)

  // Check API endpoints
  console.log('\n🔍 فحص API Endpoints...')
  const apiEndpoints = [
    'app/api/doctor/profile/route.ts',
    'app/api/doctor/patients/route.ts',
    'app/api/doctor/sessions/route.ts',
    'app/api/doctor/treatment-plans/route.ts',
    'app/api/doctor/schedule/route.ts',
    'app/api/doctor/patient-visit/route.ts',
  ]

  const fs = require('fs')
  const path = require('path')
  
  apiEndpoints.forEach(endpoint => {
    const filePath = path.join(process.cwd(), endpoint)
    const exists = fs.existsSync(filePath)
    console.log(`${exists ? '✅' : '❌'} ${endpoint}`)
  })

  // Check UI pages
  console.log('\n🔍 فحص صفحات الواجهة...')
  const uiPages = [
    'app/dashboard/doctor/page.tsx',
    'app/dashboard/doctor/sessions/page.tsx',
    'app/dashboard/doctor/treatment-plans/page.tsx',
    'app/dashboard/doctor/schedule/page.tsx',
    'app/dashboard/doctor/settings/page.tsx',
  ]

  uiPages.forEach(page => {
    const filePath = path.join(process.cwd(), page)
    const exists = fs.existsSync(filePath)
    console.log(`${exists ? '✅' : '❌'} ${page}`)
  })

  // Final assessment
  console.log('\n' + '='.repeat(60))
  if (criticalMissing === 0) {
    console.log('✅ موديول الطبيب جاهز للاستخدام!')
    if (optionalMissing > 0) {
      console.log(`⚠️  ملاحظة: ${optionalMissing} جدول اختياري مفقود (لا يؤثر على الوظائف الأساسية)`)
    }
  } else {
    console.log(`❌ موديول الطبيب غير مكتمل!`)
    console.log(`   يرجى إنشاء ${criticalMissing} جدول حرج`)
  }

  return {
    success: criticalMissing === 0,
    criticalMissing,
    optionalMissing,
    results
  }
}

checkDoctorModule()
  .then(result => {
    process.exit(result.success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

