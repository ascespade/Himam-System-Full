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
  } catch (error: any) {
    console.error('Error fetching Slack conversations:', error)
    return NextResponse.json(
      { success: false, error: error.message },
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

    // TODO: Create actual Slack channel via Slack API
    // For now, generate a channel ID
    const slackChannelId = `C${Date.now()}${Math.random().toString(36).substr(2, 9)}`

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
      console.error('Failed to send Slack notification:', e)
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Slack conversation created successfully'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating Slack conversation:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

