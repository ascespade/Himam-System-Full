import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/doctor/video-sessions/[id]
 * Update video session (e.g., upload recording, update status)
 */
export const PUT = withRateLimit(async function PUT(
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: videoSession } = await supabaseAdmin
      .from('video_sessions')
      .select('doctor_id')
      .eq('id', params.id)
      .single()

    if (!videoSession || videoSession.doctor_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const { recording_url, recording_duration, recording_size, recording_status, started_at, ended_at } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (recording_url !== undefined) updateData.recording_url = recording_url
    if (recording_duration !== undefined) updateData.recording_duration = recording_duration
    if (recording_size !== undefined) updateData.recording_size = recording_size
    if (recording_status !== undefined) updateData.recording_status = recording_status
    if (started_at !== undefined) updateData.started_at = started_at
    if (ended_at !== undefined) updateData.ended_at = ended_at

    // Select specific columns for better performance
    const { data, error } = await supabaseAdmin
      .from('video_sessions')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        id, session_id, doctor_id, patient_id, meeting_id, meeting_url, recording_url, recording_duration, recording_size, recording_status, started_at, ended_at, created_at, updated_at,
        sessions (
          id, date, session_type
        ),
        patients (
          id, name, phone
        )
      `)
      .single()

    if (error) throw error

    // If recording is completed, update session status
    if (recording_status === 'completed' && recording_url) {
      await supabaseAdmin
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', data.session_id)
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/video-sessions/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/doctor/video-sessions/[id]/upload-recording
 * Webhook endpoint for video service to upload recording automatically
 */
export const POST = withRateLimit(async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { recording_url, recording_duration, recording_size, meeting_id } = body

    // Verify meeting_id matches - select specific columns
    const { data: videoSession } = await supabaseAdmin
      .from('video_sessions')
      .select('id, session_id, doctor_id, patient_id, meeting_id, meeting_url, recording_url, recording_duration, recording_size, recording_status, started_at, ended_at, created_at, updated_at')
      .eq('id', params.id)
      .eq('meeting_id', meeting_id)
      .single()

    if (!videoSession) {
      return NextResponse.json({ success: false, error: 'Video session not found' }, { status: 404 })
    }

    // Update recording info
    const { data, error } = await supabaseAdmin
      .from('video_sessions')
      .update({
        recording_url,
        recording_duration: recording_duration || null,
        recording_size: recording_size || null,
        recording_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      // Select specific columns for better performance
      .select(`
        id, session_id, doctor_id, patient_id, meeting_id, meeting_url, recording_url, recording_duration, recording_size, recording_status, started_at, ended_at, created_at, updated_at,
        sessions (
          id, date, session_type, status
        ),
        patients (
          id, name, phone
        )
      `)
      .single()

    if (error) throw error

    // Update session status to completed
    if (data.session_id) {
      await supabaseAdmin
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', data.session_id)
    }

    // Create notification
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      const patientName = Array.isArray(data.patients) && data.patients.length > 0
        ? (data.patients[0] as { name?: string })?.name
        : (data.patients as { name?: string } | undefined)?.name
      await createNotification({
        userId: data.doctor_id,
        patientId: data.patient_id,
        ...NotificationTemplates.systemAlert(
          `تم رفع تسجيل الجلسة عن بُعد للمريض ${patientName || 'مريض'}. إن شاء الله يكون مفيد.`
        ),
        title: 'تسجيل جلسة جاهز',
        entityType: 'video_session',
        entityId: data.id
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to create notification', e, { sessionId: data.id, endpoint: '/api/doctor/video-sessions/[id]' })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/video-sessions/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

