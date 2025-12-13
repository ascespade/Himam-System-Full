/**
 * WhatsApp Analytics API
 * Get message analytics and statistics
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/analytics
 * Get WhatsApp message analytics
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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('date_from') || new Date(new Date().setDate(1)).toISOString().split('T')[0] // First day of month
    const dateTo = searchParams.get('date_to') || new Date().toISOString().split('T')[0] // Today

    const startDate = new Date(dateFrom)
    const endDate = new Date(dateTo)
    endDate.setHours(23, 59, 59, 999)

    // Get messages in date range
    const { data: messages } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Calculate statistics
    const totalMessages = messages?.length || 0
    const inboundMessages = messages?.filter((m) => m.direction === 'inbound').length || 0
    const outboundMessages = messages?.filter((m) => m.direction === 'outbound').length || 0
    const deliveredMessages = messages?.filter((m) => m.status === 'delivered').length || 0
    const readMessages = messages?.filter((m) => m.status === 'read').length || 0
    const failedMessages = messages?.filter((m) => m.status === 'failed').length || 0

    // Get unique conversations
    const { data: conversations } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const uniqueConversations = conversations?.length || 0
    const newConversations = conversations?.filter((c) => {
      const created = new Date(c.created_at)
      return created >= startDate && created <= endDate
    }).length || 0

    // Calculate average response time (time between inbound and outbound messages)
    let totalResponseTime = 0
    let responseCount = 0

    if (messages) {
      const inboundByPhone = new Map<string, any[]>()
      messages
        .filter((m) => m.direction === 'inbound')
        .forEach((m) => {
          if (!inboundByPhone.has(m.from_phone)) {
            inboundByPhone.set(m.from_phone, [])
          }
          inboundByPhone.get(m.from_phone)!.push(m)
        })

      messages
        .filter((m) => m.direction === 'outbound')
        .forEach((outbound) => {
          const inboundMessages = inboundByPhone.get(outbound.to_phone) || []
          const lastInbound = inboundMessages
            .filter((inbound) => new Date(inbound.created_at) < new Date(outbound.created_at))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

          if (lastInbound) {
            const responseTime = new Date(outbound.created_at).getTime() - new Date(lastInbound.created_at).getTime()
            totalResponseTime += responseTime
            responseCount++
          }
        })
    }

    const avgResponseTimeSeconds = responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0

    // Save or update analytics
    const analyticsData = {
      date: dateFrom,
      total_messages: totalMessages,
      inbound_messages: inboundMessages,
      outbound_messages: outboundMessages,
      delivered_messages: deliveredMessages,
      read_messages: readMessages,
      failed_messages: failedMessages,
      unique_conversations: uniqueConversations,
      new_conversations: newConversations,
      avg_response_time_seconds: Math.round(avgResponseTimeSeconds * 10) / 10,
    }

    await supabaseAdmin
      .from('whatsapp_analytics')
      .upsert(analyticsData, {
        onConflict: 'date',
      })

    return NextResponse.json({
      success: true,
      data: analyticsData,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/analytics' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

