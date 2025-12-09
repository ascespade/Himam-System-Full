/**
 * Supervisor Reviews API
 * Manage session reviews and quality checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/supervisor/reviews
 * Get session reviews
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
    const status = searchParams.get('status')
    const reviewType = searchParams.get('review_type')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('supervisor_reviews')
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
        users!supervisor_reviews_doctor_id_fkey (
          id,
          name,
          email
        ),
        users!supervisor_reviews_supervisor_id_fkey (
          id,
          name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (reviewType) {
      query = query.eq('review_type', reviewType)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: reviews, error, count } = await query

    if (error) throw error

    return NextResponse.json(successResponse({
      reviews: reviews || [],
      total: count || 0,
      limit,
      offset
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * POST /api/supervisor/reviews
 * Create a new review
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
    const { session_id, patient_id, doctor_id, review_type, findings, recommendations, priority } = body

    if (!session_id || !review_type) {
      return NextResponse.json(
        errorResponse('Session ID and review type are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: review, error } = await supabaseAdmin
      .from('supervisor_reviews')
      .insert({
        supervisor_id: user.id,
        session_id,
        patient_id: patient_id || null,
        doctor_id: doctor_id || null,
        review_type,
        status: 'pending',
        findings: findings || null,
        recommendations: recommendations || null,
        priority: priority || 'normal',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      successResponse(review, 'تم إنشاء المراجعة'),
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
