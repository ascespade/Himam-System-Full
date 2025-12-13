import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/video-sessions
 * Get doctor's video sessions
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

    const { data, error } = await supabaseAdmin
      .from('video_sessions')
      .select(`
        *,
        sessions (
          id,
          date,
          session_type,
          status
        ),
        patients (
          id,
          name,
          phone
        )
      `)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/video-sessions' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/video-sessions
 * Create new video session (for remote therapy)
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
    const { patient_id, appointment_id, session_id, scheduled_date } = body

    if (!patient_id || !scheduled_date) {
      return NextResponse.json({ success: false, error: 'Patient ID and scheduled date are required' }, { status: 400 })
    }

    // Use Slack Huddle for video sessions
    // Get or create Slack conversation first
    const { data: slackConv } = await supabaseAdmin
      .from('slack_conversations')
      .select('slack_channel_id')
      .eq('doctor_id', user.id)
      .eq('patient_id', patient_id)
      .eq('is_active', true)
      .single()

    let slackChannelId = slackConv?.slack_channel_id

    // Create Slack conversation if doesn't exist
    if (!slackChannelId) {
      const convRes = await fetch(`${req.nextUrl.origin}/api/doctor/slack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id }),
      })
      const convData = await convRes.json()
      if (convData.success) {
        slackChannelId = convData.data.slack_channel_id
      }
    }

    // Get Slack Huddle link
    const { getSlackHuddleLink } = await import('@/lib/slack-api')
    const meetingUrl = slackChannelId ? getSlackHuddleLink(slackChannelId) : null
    const meetingId = slackChannelId || `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Check recording configuration
    const configRes = await fetch(`${req.nextUrl.origin}/api/system/config/video-recording?doctor_id=${user.id}&session_type=video_call`)
    const configData = await configRes.json()
    const recordingEnabled = configData.success && configData.data.recording_enabled

    // Create session first if not provided
    let finalSessionId = session_id
    if (!session_id) {
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .insert({
          doctor_id: user.id,
          patient_id,
          appointment_id: appointment_id || null,
          date: scheduled_date,
          duration: 30,
          session_type: 'video_call',
          status: 'scheduled'
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      finalSessionId = newSession.id
    }

    // Create video session
    const { data, error } = await supabaseAdmin
      .from('video_sessions')
      .insert({
        session_id: finalSessionId,
        appointment_id: appointment_id || null,
        doctor_id: user.id,
        patient_id,
        meeting_url: meetingUrl || `https://slack.com/call/${slackChannelId}`,
        meeting_id: meetingId,
        recording_status: recordingEnabled ? 'enabled' : 'disabled',
        recording_enabled: recordingEnabled,
        slack_channel_id: slackChannelId || null,
        provider: 'slack_huddle'
      })
      .select(`
        *,
        sessions (
          id,
          date,
          session_type
        ),
        patients (
          id,
          name,
          phone
        )
      `)
      .single()

    if (error) throw error

    // Send meeting link to patient via WhatsApp
    try {
      const { data: patientData } = await supabaseAdmin
        .from('patients')
        .select('phone, name')
        .eq('id', patient_id)
        .single()

      if (patientData?.phone && meetingUrl) {
        const { sendTextMessage } = await import('@/lib/whatsapp-messaging')
        await sendTextMessage(
          patientData.phone,
          `مرحباً ${patientData.name}!\n\nتم إنشاء جلسة فيديو عبر Slack.\n\nرابط الجلسة: ${meetingUrl}\n\nالتاريخ: ${new Date(scheduled_date).toLocaleDateString('ar-SA')}\nالوقت: ${new Date(scheduled_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
        )
      }
    } catch (whatsappError) {
      console.error('Error sending WhatsApp notification:', whatsappError)
      // Don't fail the request if WhatsApp fails
    }

    // Start Slack Huddle if channel exists
    if (slackChannelId) {
      try {
        const slackApi = await import('@/lib/slack-api')
        // Slack Huddles are started by users in the channel, not via API
        // We'll just send a notification message
        await slackApi.sendSlackMessage(
          slackChannelId,
          `🎥 تم إنشاء جلسة فيديو\nالتاريخ: ${new Date(scheduled_date).toLocaleDateString('ar-SA')}\n${recordingEnabled ? '✅ التسجيل مفعّل' : '❌ التسجيل معطّل'}\n\nلبدء الجلسة، اضغط على زر Huddle في القناة.`
        )
      } catch (slackError) {
        console.error('Error sending Slack notification:', slackError)
        // Don't fail the request if Slack fails
      }
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/video-sessions' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

