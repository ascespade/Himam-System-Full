/**
 * Supervisor Critical Cases API
 * Get and manage critical cases requiring attention
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/supervisor/critical-cases
 * Get critical cases
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

    // Verify user is supervisor or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['supervisor', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        errorResponse('Forbidden - Supervisor access only'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || 'open'
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('critical_cases')
      .select(`
        *,
        patients (
          id,
          name,
          phone
        ),
        sessions (
          id,
          date,
          notes
        ),
        users!critical_cases_doctor_id_fkey (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data: cases, error, count } = await query

    if (error) throw error

    return NextResponse.json(successResponse({
      cases: cases || [],
      total: count || 0,
      limit,
      offset
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * POST /api/supervisor/critical-cases
 * Create or update critical case
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

    // Verify user is supervisor or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['supervisor', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        errorResponse('Forbidden - Supervisor access only'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const body = await req.json()
    const { patient_id, session_id, doctor_id, case_type, severity, description, detected_by } = body

    if (!patient_id || !case_type || !description) {
      return NextResponse.json(
        errorResponse('Patient ID, case type, and description are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: criticalCase, error } = await supabaseAdmin
      .from('critical_cases')
      .insert({
        patient_id,
        session_id: session_id || null,
        doctor_id: doctor_id || null,
        case_type,
        severity: severity || 'high',
        description,
        detected_by: detected_by || 'supervisor',
        status: 'open',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      successResponse(criticalCase, 'تم إنشاء حالة حرجة'),
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
