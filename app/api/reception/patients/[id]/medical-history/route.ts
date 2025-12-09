/**
 * Reception Patients Medical History API
 * Get comprehensive medical history for a patient
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { patientRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reception/patients/[id]/medical-history
 * Get comprehensive medical history for a patient
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify user is reception, admin, or doctor
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['reception', 'admin', 'doctor'].includes(userData.role)) {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    // Get patient
    const patient = await patientRepository.findById(params.id)
    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found'),
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    // Get medical history
    const history = await patientRepository.getMedicalHistory(params.id)

    // Get additional medical records
    const { data: medicalRecords } = await supabaseAdmin
      .from('medical_records')
      .select('*')
      .eq('patient_id', params.id)
      .order('created_at', { ascending: false })

    // Get insurance records
    const { receptionRepository } = await import('@/infrastructure/supabase/repositories')
    const insuranceRecords = await receptionRepository.getPatientInsurance(params.id)

    return NextResponse.json(successResponse({
      patient,
      history,
      medicalRecords: medicalRecords || [],
      insurance: insuranceRecords
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
