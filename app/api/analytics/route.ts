/**
 * Analytics API
 * Provides system-wide statistics for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'

export async function GET(req: NextRequest) {
  try {
    // 1. Get User Stats
    const { count: userCount, error: userError } = await supabaseAdmin
      .from('conversation_history')
      .select('user_phone', { count: 'exact', head: true })

    // Build unique user count query manually since count('distinct') is tricky with simple client
    // For now we'll estimate or just use raw message count as activity metric
    // A better approach for unique users:
    const { data: uniqueUsers } = await supabaseAdmin.rpc('count_unique_users')
    // If RPC doesn't exist, we might need a raw query or just fetch all distinct phones (expensive)
    // fallback:
    
    // 2. Get Message Stats
    const { count: messageCount, error: msgError } = await supabaseAdmin
      .from('conversation_history')
      .select('*', { count: 'exact', head: true })

    // 3. Get Appointment Stats
    const { data: appointments, error: aptError } = await supabaseAdmin
      .from('appointments')
      .select('status')

    if (userError || msgError || aptError) {
      throw new Error('Failed to fetch analytics data')
    }

    const totalAppointments = appointments?.length || 0
    const confirmedAppointments = appointments?.filter(a => a.status === 'confirmed').length || 0
    const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0
    const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0

    return NextResponse.json(successResponse({
      messages: {
        total: messageCount || 0,
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
