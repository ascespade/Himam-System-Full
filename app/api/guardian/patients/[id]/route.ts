/**
 * Guardian Patient Details API
 * Get limited patient details based on guardian permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { guardianRepository, patientRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/guardian/patients/[id]
 * Get patient details (limited based on permissions)
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

    // Verify user is guardian
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'guardian') {
      return NextResponse.json(
        errorResponse('Forbidden - Guardian access only'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    // Check if guardian has relationship with this patient
    const relationships = await guardianRepository.getGuardianPatients(user.id)
    const relationship = relationships.find(r => r.patient_id === params.id && r.is_active)

    if (!relationship) {
      return NextResponse.json(
        errorResponse('Patient not linked to this guardian'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    // Get patient with limited fields based on permissions
    const patient = await patientRepository.findById(params.id)
    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found'),
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    // Filter patient data based on permissions
    const limitedPatient: Record<string, unknown> = {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      status: patient.status
    }

    if (relationship.permissions.view_records) {
      limitedPatient.email = patient.email
      limitedPatient.address = patient.address
      limitedPatient.blood_type = patient.blood_type
      limitedPatient.allergies = patient.allergies
      limitedPatient.chronic_diseases = patient.chronic_diseases
      limitedPatient.emergency_contact_name = patient.emergency_contact_name
      limitedPatient.emergency_contact_phone = patient.emergency_contact_phone
    }

    return NextResponse.json(successResponse({
      patient: limitedPatient,
      relationship,
      permissions: relationship.permissions
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
