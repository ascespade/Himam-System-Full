import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/chat-history?phone=...
 * Get messages for a phone number from whatsapp_messages table
 * Same data source as /api/whatsapp/conversations/[id] but by phone number
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Phone number required' }, { status: 400 })
  }

  try {
    // First, find the conversation by phone number
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', phone)
      .single()

    if (convError && convError.code !== 'PGRST116') {
      throw convError
    }

    // If no conversation found, return empty array
    if (!conversation) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    // Transform messages to match the expected format (conversation_history style)
    // Group messages by pairing inbound (user) with next outbound (AI) message
    const transformedMessages: any[] = []
    let pendingUserMessage: any = null

    messages.forEach((msg: any) => {
      if (msg.direction === 'inbound') {
        // If there's a pending user message without AI response, add it
        if (pendingUserMessage) {
          transformedMessages.push({
            id: pendingUserMessage.id,
            user_phone: phone,
            user_message: pendingUserMessage.content || '',
            ai_response: '',
            created_at: pendingUserMessage.created_at
          })
        }
        // Store this as pending user message
        pendingUserMessage = msg
      } else if (msg.direction === 'outbound') {
        // This is AI response
        if (pendingUserMessage) {
          // Pair with pending user message
          transformedMessages.push({
            id: pendingUserMessage.id,
            user_phone: phone,
            user_message: pendingUserMessage.content || '',
            ai_response: msg.content || '',
            created_at: msg.created_at // Use AI response timestamp
          })
          pendingUserMessage = null
        } else {
          // AI response without user message (standalone)
          transformedMessages.push({
            id: msg.id,
            user_phone: phone,
            user_message: '',
            ai_response: msg.content || '',
            created_at: msg.created_at
          })
        }
      }
    })

    // Add last pending user message if exists
    if (pendingUserMessage) {
      transformedMessages.push({
        id: pendingUserMessage.id,
        user_phone: phone,
        user_message: pendingUserMessage.content || '',
        ai_response: '',
        created_at: pendingUserMessage.created_at
      })
    }

    return NextResponse.json({ success: true, data: transformedMessages })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/chat-history' })

    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
