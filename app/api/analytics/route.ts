/**
 * Analytics API
 * Provides system-wide statistics for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'

export async function GET(req: NextRequest) {
  try {
    // 1. Get Conversation Stats (unique users)
    const { count: conversationCount, error: convError } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
    
    // 2. Get Message Stats
    const { count: messageCount, error: msgError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
    
    // Get inbound/outbound breakdown
    const { count: inboundCount } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'inbound')
    
    const { count: outboundCount } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'outbound')

    // 3. Get Appointment Stats
    const { data: appointments, error: aptError } = await supabaseAdmin
      .from('appointments')
      .select('status')

    if (convError || msgError || aptError) {
      throw new Error('Failed to fetch analytics data')
    }

    const totalAppointments = appointments?.length || 0
    const confirmedAppointments = appointments?.filter(a => a.status === 'confirmed').length || 0
    const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0
    const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0

    return NextResponse.json(successResponse({
      conversations: {
        total: conversationCount || 0,
      },
      messages: {
        total: messageCount || 0,
        inbound: inboundCount || 0,
        outbound: outboundCount || 0,
      },
      appointments: {
        total: totalAppointments,
        confirmed: confirmedAppointments,
        pending: pendingAppointments,
        cancelled: cancelledAppointments,
        conversionRate: messageCount ? ((totalAppointments / messageCount) * 100).toFixed(2) + '%' : '0%'
      },
      timestamp: new Date().toISOString()
    }))

  } catch (error: any) {
    return handleApiError(error)
  }
}
