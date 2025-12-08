import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/sessions
 * Get doctor's therapy sessions
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('sessions')
      .select(`
        *,
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
  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/sessions
 * Create new therapy session
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
        *,
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
      const template = NotificationTemplates.systemAlert(
        'جلسة جديدة',
        `تم إنشاء جلسة ${session_type} للمريض ${data.patients?.name || 'مريض'}`
      )
      await createNotification({
        userId: user.id,
        ...template,
        entityType: 'session',
        entityId: data.id
      })
    } catch (e) {
      console.error('Failed to create notification:', e)
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

