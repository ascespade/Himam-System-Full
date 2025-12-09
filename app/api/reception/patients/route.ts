/**
 * Reception Patients API
 * Full patient management for reception staff
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { patientRepository } from '@/infrastructure/supabase/repositories'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reception/patients
 * Get list of patients with filters
 */
export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await patientRepository.search({
      search,
      status: status && status !== 'all' ? status : undefined,
      limit,
      offset
    })

    return NextResponse.json(successResponse({
      patients: result.patients,
      total: result.total,
      limit,
      offset
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * POST /api/reception/patients
 * Register a new patient
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
    const {
      name,
      phone,
      email,
      date_of_birth,
      gender,
      nationality,
      address,
      blood_type,
      allergies,
      chronic_diseases,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      insurance_provider,
      insurance_number,
      notes
    } = body

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        errorResponse('الاسم ورقم الهاتف مطلوبان'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Create patient using repository
    const patient = await patientRepository.create({
      name,
      phone,
      email,
      date_of_birth,
      gender,
      nationality,
      address,
      blood_type,
      allergies: Array.isArray(allergies) ? allergies : allergies ? [allergies] : undefined,
      chronic_diseases: Array.isArray(chronic_diseases) ? chronic_diseases : chronic_diseases ? [chronic_diseases] : undefined,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      notes,
      status: 'active'
    })

    // Create insurance record if provided
    if (insurance_provider && insurance_number) {
      try {
        const { receptionRepository } = await import('@/infrastructure/supabase/repositories')
        await receptionRepository.createInsurance({
          patient_id: patient.id,
          provider: insurance_provider,
          policy_number: insurance_number
        })
      } catch (e) {
        console.error('Failed to create insurance record:', e)
        // Don't fail the whole request if insurance fails
      }
    }

    // Create Notification for new patient registration
    try {
      const { createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
      
      const template = NotificationTemplates.patientRegistered(name)

      // Notify admin
      await createNotificationForRole('admin', {
        ...template,
        entityType: 'patient',
        entityId: patient.id
      })

      // Notify reception staff
      await createNotificationForRole('reception', {
        ...template,
        entityType: 'patient',
        entityId: patient.id
      })
    } catch (e) {
      console.error('Failed to create patient registration notification:', e)
    }

    return NextResponse.json(
      successResponse(patient, 'تم تسجيل المريض بنجاح'),
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
