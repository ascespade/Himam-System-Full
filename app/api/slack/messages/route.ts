import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/slack/messages
 * Get messages from a Slack conversation
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('slack_messages')
      .select(`
        *,
        users (
          id,
          name
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const transformed = (data || []).map((msg: Record<string, unknown>) => {
      const users = msg.users as Record<string, unknown> | undefined
      return {
        ...msg,
        sender_name: users?.name || 'غير معروف'
      }
    })

    return NextResponse.json({
      success: true,
      data: transformed
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/slack/messages' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/slack/messages
 * Send message via Slack (sync with database)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { conversation_id, message_text, sender_id, sender_type } = body

    if (!conversation_id || !message_text) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID and message text are required' },
        { status: 400 }
      )
    }

    // TODO: Send message to Slack API
    // For now, just store in database
    const slackMessageTs = `${Date.now() / 1000}.${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabaseAdmin
      .from('slack_messages')
      .insert({
        conversation_id,
        slack_message_ts: slackMessageTs,
        sender_id: sender_id || null,
        sender_type: sender_type || 'doctor',
        message_text,
        is_read: false
      })
      .select()
      .single()

    if (error) throw error

    // Update conversation last_message_at
    await supabaseAdmin
      .from('slack_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation_id)

    return NextResponse.json({
      success: true,
      data,
      message: 'Message sent. Will be synced with Slack.'
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/slack/messages' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

