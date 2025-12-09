import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get unique conversations. 
    // Supabase JS doesn't support DISTINCT ON easily with typed builder sometimes, but we can try raw RPC or manual processing.
    // simpler approach: fetch all, process in memory (if small) or use .rpc() if we made a function.
    // For MVP, we fetch the latest 100 messages and group them.
    
    const { data, error } = await supabaseAdmin
      .from('conversation_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    // Group by phone
    const conversationMap = new Map()
    data.forEach((msg: any) => {
      if (!conversationMap.has(msg.user_phone)) {
        conversationMap.set(msg.user_phone, {
           phone: msg.user_phone,
           lastMessage: msg.user_message || msg.ai_response,
           date: msg.created_at,
           unread: 0 
        })
      }
    })

    const conversations = Array.from(conversationMap.values())

    return NextResponse.json({ success: true, data: conversations })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
