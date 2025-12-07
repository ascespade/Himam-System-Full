import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/patients/[id]/medical-file
 * Get comprehensive medical file for a patient
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check Authentication
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // API routes can't set cookies easily in this pattern, but we only need to read
          },
          remove(name: string, options: CookieOptions) {
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get patient info
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', params.id)
      .single()

    if (patientError) {
       if (patientError.code === 'PGRST116') {
         return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 })
       }
       throw patientError
    }

    // 3. Parallel Fetching for Performance
    const [
      { data: records },
      { data: diagnoses },
      { data: prescriptions },
      { data: labResults },
      { data: imagingResults },
      { data: vitalSigns },
      { data: doctors }
    ] = await Promise.all([
      supabaseAdmin.from('medical_records').select('*').eq('patient_id', params.id).order('date', { ascending: false }),
      supabaseAdmin.from('diagnoses').select('*').eq('patient_id', params.id).order('diagnosed_date', { ascending: false }),
      supabaseAdmin.from('prescriptions').select('*').eq('patient_id', params.id).order('prescribed_date', { ascending: false }),
      supabaseAdmin.from('lab_results').select('*').eq('patient_id', params.id).order('performed_date', { ascending: false }),
      supabaseAdmin.from('imaging_results').select('*').eq('patient_id', params.id).order('performed_date', { ascending: false }),
      supabaseAdmin.from('vital_signs').select('*').eq('patient_id', params.id).order('visit_date', { ascending: false }).limit(10),
      supabaseAdmin.from('doctor_patient_relationships').select('*, users!doctor_id(id, name, email)').eq('patient_id', params.id).is('end_date', null)
    ])

    return NextResponse.json({
      success: true,
      data: {
        patient,
        medical_records: records || [],
        diagnoses: diagnoses || [],
        prescriptions: prescriptions || [],
        lab_results: labResults || [],
        imaging_results: imagingResults || [],
        vital_signs: vitalSigns || [],
        doctors: (doctors || []).map((d: any) => ({
          ...d,
          doctor_name: d.users?.name,
          doctor_email: d.users?.email
        }))
      }
    })
  } catch (error: any) {
    console.error('Error fetching medical file:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

