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
      const pdfContent = `
تقرير ملف طبي
${'='.repeat(50)}
المريض: ${exportData.patient.name}
الهاتف: ${exportData.patient.phone}
تاريخ الميلاد: ${exportData.patient.date_of_birth || 'غير متوفر'}
الجنس: ${exportData.patient.gender || 'غير متوفر'}
${'='.repeat(50)}

${exportData.sessions ? `\nالجلسات (${exportData.sessions.length}):\n${exportData.sessions.map((s: any, i: number) => `${i + 1}. ${new Date(s.date).toLocaleDateString('ar-SA')} - ${s.session_type || 'جلسة'}`).join('\n')}` : ''}

${exportData.medical_records ? `\nالسجلات الطبية (${exportData.medical_records.length}):\n${exportData.medical_records.map((r: any, i: number) => `${i + 1}. ${r.record_type || 'سجل'} - ${new Date(r.created_at).toLocaleDateString('ar-SA')}`).join('\n')}` : ''}

${exportData.treatment_plans ? `\nخطط العلاج (${exportData.treatment_plans.length}):\n${exportData.treatment_plans.map((p: any, i: number) => `${i + 1}. ${p.title || 'خطة علاج'}`).join('\n')}` : ''}

${exportData.progress_tracking ? `\nتتبع التقدم (${exportData.progress_tracking.length}):\n${exportData.progress_tracking.map((p: any, i: number) => `${i + 1}. ${p.title || 'تقدم'}`).join('\n')}` : ''}

${'='.repeat(50)}
تاريخ التصدير: ${new Date(exportData.exported_at).toLocaleString('ar-SA')}
      `.trim()

      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="patient-${exportData.patient.id}-report.txt"`,
        },
      })
    } else if (format === 'csv') {
      // Generate CSV
      const csvRows: string[] = []
      
      // CSV Header
      csvRows.push('النوع,التاريخ,الوصف')
      
      // Sessions
      if (exportData.sessions) {
        exportData.sessions.forEach((s: any) => {
          csvRows.push(`جلسة,"${new Date(s.date).toLocaleDateString('ar-SA')}","${(s.session_type || 'جلسة').replace(/"/g, '""')}"`)
        })
      }
      
      // Medical Records
      if (exportData.medical_records) {
        exportData.medical_records.forEach((r: any) => {
          csvRows.push(`سجل طبي,"${new Date(r.created_at).toLocaleDateString('ar-SA')}","${(r.record_type || 'سجل').replace(/"/g, '""')}"`)
        })
      }
      
      // Treatment Plans
      if (exportData.treatment_plans) {
        exportData.treatment_plans.forEach((p: any) => {
          csvRows.push(`خطة علاج,"${new Date(p.created_at).toLocaleDateString('ar-SA')}","${(p.title || 'خطة').replace(/"/g, '""')}"`)
        })
      }
      
      const csvContent = csvRows.join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="patient-${exportData.patient.id}-export.csv"`,
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

