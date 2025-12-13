import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/slack/[patient_id]
 * Get Slack conversation with specific patient
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { patient_id: string } }
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

    const { data: conversation, error: convError } = await supabaseAdmin
      .from('slack_conversations')
      .select(`
        *,
        patients (
          id,
          name,
          phone
        )
      `)
      .eq('doctor_id', user.id)
      .eq('patient_id', params.patient_id)
      .single()

    if (convError && convError.code !== 'PGRST116') {
      throw convError
    }

    // Get messages if conversation exists
    let messages = []
    if (conversation) {
      const { data: msgs, error: msgsError } = await supabaseAdmin
        .from('slack_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (!msgsError) {
        messages = msgs || []
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        conversation: conversation || null,
        messages
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/slack/[patient_id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/slack/[patient_id]
 * Send message to patient via Slack
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { patient_id: string } }
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

    const body = await req.json()
    const { message_text } = body

    if (!message_text) {
      return NextResponse.json({ success: false, error: 'Message text is required' }, { status: 400 })
    }

    // Get or create conversation
    let conversation
    const { data: existing } = await supabaseAdmin
      .from('slack_conversations')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('patient_id', params.patient_id)
      .single()

    if (existing) {
      conversation = existing
    } else {
      // Create new conversation
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('name')
        .eq('id', params.patient_id)
        .single()

      const channelName = `doctor-${user.id.slice(0, 8)}-patient-${params.patient_id.slice(0, 8)}`
      const slackChannelId = `C${Date.now()}${Math.random().toString(36).substr(2, 9)}`

      const { data: newConv, error: createError } = await supabaseAdmin
        .from('slack_conversations')
        .insert({
          doctor_id: user.id,
          patient_id: params.patient_id,
          slack_channel_id: slackChannelId,
          slack_channel_name: channelName,
          is_active: true
        })
        .select()
        .single()

      if (createError) throw createError
      conversation = newConv
    }

    // Send message to Slack
    try {
      const { sendSlackNotification } = await import('@/lib/slack')
      await sendSlackNotification({
        text: `[Channel: ${conversation.slack_channel_id}] ${message_text}`
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to send Slack message', e, { patientId: params.patient_id, endpoint: '/api/doctor/slack/[patient_id]' })
    }

    // Store message in database
    const slackMessageTs = `${Date.now() / 1000}.${Math.random().toString(36).substr(2, 9)}`

    const { data: message, error: msgError } = await supabaseAdmin
      .from('slack_messages')
      .insert({
        conversation_id: conversation.id,
        slack_message_ts: slackMessageTs,
        sender_id: user.id,
        sender_type: 'doctor',
        message_text,
        is_read: false
      })
      .select()
      .single()

    if (msgError) throw msgError

    // Update conversation last_message_at
    await supabaseAdmin
      .from('slack_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)

    return NextResponse.json({
      success: true,
      data: message
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/slack/[patient_id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

