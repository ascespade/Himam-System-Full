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

    const exportData: any = {
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
      // TODO: Generate PDF using a library like pdfkit or puppeteer
      // For now, return JSON
      return NextResponse.json({
        success: true,
        data: exportData,
        format: 'json', // Fallback to JSON
        message: 'PDF export not yet implemented, returning JSON',
      })
    } else if (format === 'csv') {
      // TODO: Convert to CSV
      return NextResponse.json({
        success: true,
        data: exportData,
        format: 'json', // Fallback to JSON
        message: 'CSV export not yet implemented, returning JSON',
      })
    } else {
      // JSON format (default)
      return NextResponse.json({
        success: true,
        data: exportData,
        format: 'json',
      })
    }
  } catch (error: any) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

