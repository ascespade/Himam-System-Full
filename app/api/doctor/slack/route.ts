import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/slack
 * Get all Slack conversations for the logged-in doctor
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
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/slack' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/slack
 * Create or get Slack conversation with a patient
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
    const { patient_id } = body

    if (!patient_id) {
      return NextResponse.json({ success: false, error: 'Patient ID is required' }, { status: 400 })
    }

    // Check if conversation already exists
    const { data: existing } = await supabaseAdmin
      .from('slack_conversations')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('patient_id', patient_id)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Conversation already exists'
      })
    }

    // Get patient info
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('name, phone')
      .eq('id', patient_id)
      .single()

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 })
    }

    // Get doctor info
    const { data: doctor } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    // Create Slack channel name
    const channelName = `doctor-${user.id.slice(0, 8)}-patient-${patient_id.slice(0, 8)}`

    // Create actual Slack channel via Slack API
    let slackChannelId: string
    try {
      const { createSlackChannel } = await import('@/lib/slack-api')
      const channel = await createSlackChannel(channelName, true) // Private channel
      slackChannelId = channel.id
      
      // Send welcome message
      await import('@/lib/slack-api').then(({ sendSlackMessage }) =>
        sendSlackMessage(slackChannelId, `مرحباً! تم إنشاء قناة التواصل بين الطبيب والمريض.`)
      )
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error creating Slack channel', error, { endpoint: '/api/doctor/slack' })
      // Fallback to generated ID if Slack API fails
      slackChannelId = `C${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }

    const { data, error } = await supabaseAdmin
      .from('slack_conversations')
      .insert({
        doctor_id: user.id,
        patient_id,
        slack_channel_id: slackChannelId,
        slack_channel_name: channelName,
        is_active: true
      })
      .select(`
        *,
        patients (
          id,
          name,
          phone
        )
      `)
      .single()

    if (error) throw error

    // Send notification to Slack
    try {
      const { sendSlackNotification } = await import('@/lib/slack')
      await sendSlackNotification({
        text: `[Channel: ${slackChannelId}] تم إنشاء قناة تواصل جديدة بين الطبيب ${doctor?.name || 'طبيب'} والمريض ${patient.name}`
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to send Slack notification', e, { endpoint: '/api/doctor/slack' })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Slack conversation created successfully'
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/slack' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

