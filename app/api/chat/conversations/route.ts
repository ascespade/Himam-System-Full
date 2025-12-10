import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/chat/conversations
 * Get all WhatsApp conversations from whatsapp_conversations table
 * Same data source as /api/whatsapp/conversations but without auth requirement
 */
export async function GET() {
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
    const conversations = (data || []).map((conv: any) => ({
      id: conv.id,
      phone: conv.phone_number,
      lastMessage: '', // Will be populated from messages if needed
      date: conv.last_message_at || conv.created_at,
      unread: conv.unread_count || 0,
      status: conv.status,
      patient: conv.patients ? {
        id: conv.patients.id,
        name: conv.patients.name,
        phone: conv.patients.phone
      } : null
    }))

    return NextResponse.json({ success: true, data: conversations })
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
