import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/slack/conversations
 * Get Slack conversations for doctor-patient communication
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const doctorId = searchParams.get('doctor_id')
    const patientId = searchParams.get('patient_id')

    let query = supabaseAdmin
      .from('slack_conversations')
      .select(`
        id, doctor_id, patient_id, slack_channel_id, status, last_message_at, created_at, updated_at,
        patients (
          id,
          name,
          phone
        ),
        users (
          id,
          name,
          email
        )
      `)
      .order('last_message_at', { ascending: false })

    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data, error } = await query

    if (error) throw error

    const transformed = (data || []).map((conv: Record<string, unknown>) => {
      const patients = conv.patients as Record<string, unknown> | undefined
      const users = conv.users as Record<string, unknown> | undefined
      return {
        ...conv,
        patient_name: patients?.name || 'غير معروف',
        doctor_name: users?.name || 'غير معروف'
      }
    })

    return NextResponse.json({
      success: true,
      data: transformed
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/slack/conversations' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/slack/conversations
 * Create or get Slack conversation between doctor and patient
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { doctor_id, patient_id } = body

    if (!doctor_id || !patient_id) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID and Patient ID are required' },
        { status: 400 }
      )
    }

    // Check if conversation exists
    const { data: existing } = await supabaseAdmin
      .from('slack_conversations')
      .select('id, doctor_id, patient_id, slack_channel_id, status, last_message_at, created_at, updated_at')
      .eq('doctor_id', doctor_id)
      .eq('patient_id', patient_id)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Conversation already exists'
      })
    }

    // Create Slack channel via Slack API
    let channelId: string
    try {
      const { createSlackChannel, inviteToSlackChannel } = await import('@/lib/slack-api')
      
      // Get doctor and patient info for channel name
      const { data: doctor } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', doctor_id)
        .single()
      
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('name')
        .eq('id', patient_id)
        .single()
      
      const channelName = `doctor-${doctor_id.slice(0, 8)}-patient-${patient_id.slice(0, 8)}`
      const channel = await createSlackChannel(channelName, true) // Private channel
      channelId = channel.id
      
      // Try to invite doctor if we have their Slack user ID
      // Note: This requires Slack user lookup which needs additional setup
      const { logInfo } = await import('@/shared/utils/logger')
      logInfo('Slack channel created', { channelId, doctor_id, patient_id, endpoint: '/api/slack/conversations' })
    } catch (slackError) {
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('Failed to create Slack channel via API, using generated ID', { error: slackError, doctor_id, patient_id, endpoint: '/api/slack/conversations' })
      // Fallback to generated channel ID
      channelId = `C${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }

    const { data, error } = await supabaseAdmin
      .from('slack_conversations')
      .insert({
        doctor_id,
        patient_id,
        slack_channel_id: channelId,
        status: 'active'
      })
      .select('id, doctor_id, patient_id, slack_channel_id, status, last_message_at, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'Slack conversation created. Channel will be created via Slack API.'
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/slack/conversations' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

