import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimitCheck, addRateLimitHeadersToResponse } from '@/core/api/middleware/applyRateLimit'

/**
 * GET /api/patients/[id]/medical-file
 * Get comprehensive medical file for a patient
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

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
      .select('id, name, phone, email, nationality, date_of_birth, gender, address, status, allergies, chronic_diseases, emergency_contact, notes, created_at, updated_at')
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
      supabaseAdmin.from('medical_records').select('id, patient_id, doctor_id, date, record_type, title, description, notes, attachments, created_at, updated_at').eq('patient_id', params.id).order('date', { ascending: false }),
      supabaseAdmin.from('diagnoses').select('id, patient_id, doctor_id, diagnosis_code, diagnosis_name, diagnosed_date, severity, status, notes, created_at, updated_at').eq('patient_id', params.id).order('diagnosed_date', { ascending: false }),
      supabaseAdmin.from('prescriptions').select('id, patient_id, doctor_id, medication_name, dosage, frequency, duration, prescribed_date, notes, created_at, updated_at').eq('patient_id', params.id).order('prescribed_date', { ascending: false }),
      supabaseAdmin.from('lab_results').select('id, patient_id, test_name, test_type, result_value, result_unit, normal_range, performed_date, notes, created_at, updated_at').eq('patient_id', params.id).order('performed_date', { ascending: false }),
      supabaseAdmin.from('imaging_results').select('id, patient_id, imaging_type, imaging_date, findings, notes, file_url, created_at, updated_at').eq('patient_id', params.id).order('performed_date', { ascending: false }),
      supabaseAdmin.from('vital_signs').select('id, patient_id, visit_date, blood_pressure, heart_rate, temperature, weight, height, bmi, notes, created_at, updated_at').eq('patient_id', params.id).order('visit_date', { ascending: false }).limit(10),
      supabaseAdmin.from('doctor_patient_relationships').select('id, patient_id, doctor_id, start_date, end_date, status, notes, created_at, updated_at, users!doctor_id(id, name, email)').eq('patient_id', params.id).is('end_date', null)
    ])

    const response = NextResponse.json({
      success: true,
      data: {
        patient,
        medical_records: records || [],
        diagnoses: diagnoses || [],
        prescriptions: prescriptions || [],
        lab_results: labResults || [],
        imaging_results: imagingResults || [],
        vital_signs: vitalSigns || [],
        doctors: (doctors || []).map((d: Record<string, unknown>) => ({
          ...d,
          doctor_name: (d.users as Record<string, unknown>)?.name,
          doctor_email: (d.users as Record<string, unknown>)?.email
        }))
      }
    })
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب الملف الطبي'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching medical file', error, { endpoint: '/api/patients/[id]/medical-file', patientId: params.id })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

