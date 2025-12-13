import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

/**
 * GET /api/chat/conversations
 * Get all WhatsApp conversations from whatsapp_conversations table
 * Same data source as /api/whatsapp/conversations but without auth requirement
 */
export const GET = withRateLimit(async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select(`
        id,
        phone_number,
        status,
        unread_count,
        last_message_at,
        created_at,
        patients (id, name, phone)
      `)
      .order('last_message_at', { ascending: false })
      .limit(500)

    if (error) throw error

    // Transform to match the expected format
    const conversations = (data || []).map((conv: Record<string, unknown>) => ({
      id: conv.id,
      phone: conv.phone_number,
      lastMessage: '', // Will be populated from messages if needed
      date: conv.last_message_at || conv.created_at,
      unread: conv.unread_count || 0,
      status: conv.status,
      patient: conv.patients && typeof conv.patients === 'object' ? {
        id: (conv.patients as Record<string, unknown>).id as string,
        name: (conv.patients as Record<string, unknown>).name as string,
        phone: (conv.patients as Record<string, unknown>).phone as string
      } : null
    }))

    return NextResponse.json({ success: true, data: conversations })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/chat/conversations' })

    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}, 'api')
