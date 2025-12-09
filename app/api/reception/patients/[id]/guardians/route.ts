/**
 * Reception Patients Guardians API
 * Manage guardian relationships for patients
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { guardianRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reception/patients/[id]/guardians
 * Get all guardians for a patient
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

    // Verify user is reception or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['reception', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const relationships = await guardianRepository.getPatientGuardians(params.id)

    // Enrich with guardian and patient details
    const enriched = await Promise.all(
      relationships.map(async (rel) => {
        const [guardian, patient] = await Promise.all([
          supabaseAdmin.from('users').select('id, name, email, phone').eq('id', rel.guardian_id).single(),
          supabaseAdmin.from('patients').select('id, name').eq('id', rel.patient_id).single()
        ])

        return {
          ...rel,
          guardian: guardian.data,
          patient: patient.data
        }
      })
    )

    return NextResponse.json(successResponse(enriched))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * POST /api/reception/patients/[id]/guardians
 * Link a guardian to a patient
 */
export async function POST(
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

    // Verify user is reception or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['reception', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const body = await req.json()
    const { guardian_id, relationship_type, is_primary, permissions } = body

    if (!guardian_id || !relationship_type) {
      return NextResponse.json(
        errorResponse('Guardian ID and relationship type are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const relationship = await guardianRepository.linkGuardian({
      guardian_id,
      patient_id: params.id,
      relationship_type,
      is_primary,
      permissions
    })

    return NextResponse.json(
      successResponse(relationship, 'تم ربط ولي الأمر بنجاح'),
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
