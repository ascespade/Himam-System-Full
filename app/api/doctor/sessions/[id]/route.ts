import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimitCheck, addRateLimitHeadersToResponse } from '@/core/api/middleware/applyRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/sessions/[id]
 * Get session details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse
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

    // Select specific columns for better performance
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        id, patient_id, doctor_id, appointment_id, date, duration, session_type, status, chief_complaint, assessment, plan, notes, created_at, updated_at,
        patients (
          name,
          phone,
          date_of_birth,
          gender
        ),
        video_sessions (
          id, session_id, meeting_url, recording_url, recording_status, start_time, end_time
        )
      `)
      .eq('id', params.id)
      .eq('doctor_id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/sessions/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/doctor/sessions/[id]
 * Update session
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse
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

    // Verify ownership
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('doctor_id')
      .eq('id', params.id)
      .single()

    if (!session || session.doctor_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const updateData: Record<string, unknown> = {}

    if (body.date !== undefined) updateData.date = body.date
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.session_type !== undefined) updateData.session_type = body.session_type
    if (body.status !== undefined) updateData.status = body.status
    if (body.chief_complaint !== undefined) updateData.chief_complaint = body.chief_complaint
    if (body.assessment !== undefined) updateData.assessment = body.assessment
    if (body.plan !== undefined) updateData.plan = body.plan
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update(updateData)
      .eq('id', params.id)
      // Select specific columns for better performance
      .select(`
        id, patient_id, doctor_id, appointment_id, date, duration, session_type, status, chief_complaint, assessment, plan, notes, created_at, updated_at,
        patients (
          name,
          phone
        )
      `)
      .single()

    if (error) throw error

    const response = NextResponse.json({
      success: true,
      data
    })
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/sessions/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/doctor/sessions/[id]
 * Delete session
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse
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

    // Verify ownership
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('doctor_id')
      .eq('id', params.id)
      .single()

    if (!session || session.doctor_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not found or unauthorized' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    const response = NextResponse.json({
      success: true
    })
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/sessions/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

