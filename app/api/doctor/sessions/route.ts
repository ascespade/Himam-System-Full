import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/sessions
 * Get doctor's therapy sessions
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from('sessions')
      .select(`
        id, doctor_id, patient_id, appointment_id, date, duration, session_type, status, chief_complaint, assessment, plan, notes, created_at, updated_at,
        patients (
          name,
          phone
        ),
        video_sessions (
          meeting_url,
          recording_url,
          recording_status
        )
      `)
      .eq('doctor_id', user.id)

    if (type && type !== 'all') {
      query = query.eq('session_type', type)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/sessions' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/doctor/sessions
 * Create new therapy session
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { patient_id, appointment_id, date, duration, session_type, status, chief_complaint, assessment, plan, notes } = body

    // Validate
    if (!patient_id || !date || !session_type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        doctor_id: user.id,
        patient_id,
        appointment_id: appointment_id || null,
        date,
        duration: duration || 30,
        session_type,
        status: status || 'scheduled',
        chief_complaint: chief_complaint || null,
        assessment: assessment || null,
        plan: plan || null,
        notes: notes || null
      })
      .select(`
        id, doctor_id, patient_id, appointment_id, date, duration, session_type, status, chief_complaint, assessment, plan, notes, created_at, updated_at,
        patients (
          name,
          phone
        )
      `)
      .single()

    if (error) throw error

    // Create notification
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      const patients = data.patients as Array<{ name?: string; phone?: string }> | undefined
      const patientName = Array.isArray(patients) && patients.length > 0 ? patients[0]?.name : undefined
      const template = NotificationTemplates.systemAlert(
        `تم إنشاء جلسة ${session_type} للمريض ${patientName || 'مريض'}`
      )
      await createNotification({
        userId: user.id,
        ...template,
        title: 'جلسة جديدة',
        entityType: 'session',
        entityId: data.id
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to create notification', e, { sessionId: data.id, endpoint: '/api/doctor/sessions' })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/sessions' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

