/**
 * Guardian Patients API
 * Get list of patients linked to the authenticated guardian
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { guardianRepository, patientRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '@/lib'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/guardian/patients
 * Get all patients linked to the authenticated guardian
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
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

    // Get all patients linked to this guardian
    const relationships = await guardianRepository.getGuardianPatients(user.id)

    // Enrich with patient details
    const patients = await Promise.all(
      relationships.map(async (rel) => {
        const patient = await patientRepository.findById(rel.patient_id)
        return {
          id: patient?.id,
          name: patient?.name,
          phone: patient?.phone,
          date_of_birth: patient?.date_of_birth,
          gender: patient?.gender,
          relationship_type: rel.relationship_type,
          is_primary: rel.is_primary,
          permissions: rel.permissions,
        }
      })
    )

    return NextResponse.json(successResponse(patients.filter((p) => p.id !== undefined)))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}, 'api')
