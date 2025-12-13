/**
 * WhatsApp Debug Endpoint
 * Check if messages are being received and processed
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

export const GET = withRateLimit(async function GET(req: NextRequest) {
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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get recent inbound messages
    const { data: inboundMessages } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('id, message_id, from_phone, to_phone, message_type, content, status, direction, session_id, conversation_id, patient_id, created_at, updated_at')
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent outbound messages
    const { data: outboundMessages } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('id, message_id, from_phone, to_phone, message_type, content, status, direction, session_id, conversation_id, patient_id, created_at, updated_at')
      .eq('direction', 'outbound')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent conversations
    const { data: conversations } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, phone_number, patient_id, status, last_message_at, unread_count, assigned_to, tags, notes, created_at, updated_at')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(10)

    // Count messages by status
    const { data: statusCounts } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('status, direction')
      .order('created_at', { ascending: false })
      .limit(100)

    const counts = {
      inbound: statusCounts?.filter(m => m.direction === 'inbound').length || 0,
      outbound: statusCounts?.filter(m => m.direction === 'outbound').length || 0,
      sent: statusCounts?.filter(m => m.status === 'sent' || m.status === 'delivered').length || 0,
      failed: statusCounts?.filter(m => m.status === 'failed').length || 0,
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalInbound: inboundMessages?.length || 0,
        totalOutbound: outboundMessages?.length || 0,
        totalConversations: conversations?.length || 0,
        counts,
      },
      recentInbound: inboundMessages || [],
      recentOutbound: outboundMessages || [],
      recentConversations: conversations || [],
      webhookUrl: `https://${req.headers.get('host')}/api/whatsapp`,
      checkList: {
        webhookConfigured: 'Check Meta Developer Console → Webhooks',
        verifyToken: 'Must match Verify Token in settings',
        subscribedEvents: 'Should include: messages, message_status',
        accessToken: 'Must be valid and not expired',
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/debug' })

    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}, 'api')




