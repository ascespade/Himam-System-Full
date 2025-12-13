/**
 * Export & Print API
 * Export patient data, reports, and documents
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * POST /api/doctor/export
 * Export patient data in various formats
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, options: CookieOptions) {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { patient_id, export_type, format, include_sessions, include_records, include_progress } = body

    if (!patient_id || !export_type) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and export type are required' },
        { status: 400 }
      )
    }

    // Verify patient belongs to doctor
    const { data: relationship } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select('id')
      .eq('doctor_id', user.id)
      .eq('patient_id', patient_id)
      .is('end_date', null)
      .single()

    if (!relationship) {
      return NextResponse.json(
        { success: false, error: 'Patient not assigned to this doctor' },
        { status: 403 }
      )
    }

    // Fetch patient data
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patient_id)
      .single()

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 })
    }

    const exportData: Record<string, unknown> = {
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        created_at: patient.created_at,
      },
      exported_at: new Date().toISOString(),
      exported_by: user.id,
    }

    // Include sessions if requested
    if (include_sessions) {
      const { data: sessions } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('patient_id', patient_id)
        .eq('doctor_id', user.id)
        .order('date', { ascending: false })

      exportData.sessions = sessions || []
    }

    // Include medical records if requested
    if (include_records) {
      const { data: records } = await supabaseAdmin
        .from('medical_records')
        .select('*')
        .eq('patient_id', patient_id)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      exportData.medical_records = records || []
    }

    // Include progress tracking if requested
    if (include_progress) {
      const { data: progress } = await supabaseAdmin
        .from('patient_progress_tracking')
        .select('*')
        .eq('patient_id', patient_id)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      exportData.progress_tracking = progress || []
    }

    // Include treatment plans
    const { data: treatmentPlans } = await supabaseAdmin
      .from('treatment_plans')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false })

    exportData.treatment_plans = treatmentPlans || []

    // Format based on requested format
    if (format === 'pdf') {
      // Generate simple PDF as text/plain for now (can be enhanced with pdfkit later)
      const patient = exportData.patient as Record<string, unknown>
      const sessions = Array.isArray(exportData.sessions) ? exportData.sessions as Array<Record<string, unknown>> : null
      const medicalRecords = Array.isArray(exportData.medical_records) ? exportData.medical_records as Array<Record<string, unknown>> : null
      const treatmentPlans = Array.isArray(exportData.treatment_plans) ? exportData.treatment_plans as Array<Record<string, unknown>> : null
      const progressTracking = Array.isArray(exportData.progress_tracking) ? exportData.progress_tracking as Array<Record<string, unknown>> : null
      const exportedAt = exportData.exported_at && (typeof exportData.exported_at === 'string' || exportData.exported_at instanceof Date) 
        ? new Date(exportData.exported_at) 
        : new Date()

      const pdfContent = `
تقرير ملف طبي
${'='.repeat(50)}
المريض: ${patient.name || 'غير متوفر'}
الهاتف: ${patient.phone || 'غير متوفر'}
تاريخ الميلاد: ${patient.date_of_birth || 'غير متوفر'}
الجنس: ${patient.gender || 'غير متوفر'}
${'='.repeat(50)}

${sessions ? `\nالجلسات (${sessions.length}):\n${sessions.map((s, i) => {
  const date = s.date && (typeof s.date === 'string' || s.date instanceof Date) ? new Date(s.date) : new Date()
  return `${i + 1}. ${date.toLocaleDateString('ar-SA')} - ${s.session_type || 'جلسة'}`
}).join('\n')}` : ''}

${medicalRecords ? `\nالسجلات الطبية (${medicalRecords.length}):\n${medicalRecords.map((r, i) => {
  const date = r.created_at && (typeof r.created_at === 'string' || r.created_at instanceof Date) ? new Date(r.created_at) : new Date()
  return `${i + 1}. ${r.record_type || 'سجل'} - ${date.toLocaleDateString('ar-SA')}`
}).join('\n')}` : ''}

${treatmentPlans ? `\nخطط العلاج (${treatmentPlans.length}):\n${treatmentPlans.map((p, i) => `${i + 1}. ${p.title || 'خطة علاج'}`).join('\n')}` : ''}

${progressTracking ? `\nتتبع التقدم (${progressTracking.length}):\n${progressTracking.map((p, i) => `${i + 1}. ${p.title || 'تقدم'}`).join('\n')}` : ''}

${'='.repeat(50)}
تاريخ التصدير: ${exportedAt.toLocaleString('ar-SA')}
      `.trim()

      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="patient-${(exportData.patient as Record<string, unknown>).id || 'unknown'}-report.txt"`,
        },
      })
    } else if (format === 'csv') {
      // Generate CSV
      const csvRows: string[] = []
      
      // CSV Header
      csvRows.push('النوع,التاريخ,الوصف')
      
      // Sessions
      const sessions = Array.isArray(exportData.sessions) ? exportData.sessions as Array<Record<string, unknown>> : null
      if (sessions) {
        sessions.forEach((s) => {
          const date = s.date && (typeof s.date === 'string' || s.date instanceof Date) ? new Date(s.date) : new Date()
          const sessionType = typeof s.session_type === 'string' ? s.session_type : 'جلسة'
          csvRows.push(`جلسة,"${date.toLocaleDateString('ar-SA')}","${sessionType.replace(/"/g, '""')}"`)
        })
      }
      
      // Medical Records
      const medicalRecords = Array.isArray(exportData.medical_records) ? exportData.medical_records as Array<Record<string, unknown>> : null
      if (medicalRecords) {
        medicalRecords.forEach((r) => {
          const date = r.created_at && (typeof r.created_at === 'string' || r.created_at instanceof Date) ? new Date(r.created_at) : new Date()
          const recordType = typeof r.record_type === 'string' ? r.record_type : 'سجل'
          csvRows.push(`سجل طبي,"${date.toLocaleDateString('ar-SA')}","${recordType.replace(/"/g, '""')}"`)
        })
      }
      
      // Treatment Plans
      const treatmentPlans = Array.isArray(exportData.treatment_plans) ? exportData.treatment_plans as Array<Record<string, unknown>> : null
      if (treatmentPlans) {
        treatmentPlans.forEach((p) => {
          const date = p.created_at && (typeof p.created_at === 'string' || p.created_at instanceof Date) ? new Date(p.created_at) : new Date()
          const title = typeof p.title === 'string' ? p.title : 'خطة'
          csvRows.push(`خطة علاج,"${date.toLocaleDateString('ar-SA')}","${title.replace(/"/g, '""')}"`)
        })
      }
      
      const csvContent = csvRows.join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="patient-${(exportData.patient as Record<string, unknown>).id || 'unknown'}-export.csv"`,
        },
      })
    } else {
      // JSON format (default)
      return NextResponse.json({
        success: true,
        data: exportData,
        format: 'json',
      })
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/export' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

