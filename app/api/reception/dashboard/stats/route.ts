/**
 * GET /api/reception/dashboard/stats
 * Get reception dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      )
    }

    // Verify user is reception or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['reception', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: 403 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.toISOString()
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    const todayEndISO = todayEnd.toISOString()

    // Get today's stats
    const [
      newPatientsToday,
      totalPatients,
      appointmentsToday,
      queueStats,
      upcomingAppointments
    ] = await Promise.all([
      // New patients today
      supabaseAdmin
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lt('created_at', todayEndISO),

      // Total patients
      supabaseAdmin
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Appointments today
      supabaseAdmin
        .from('appointments')
        .select('id, status', { count: 'exact' })
        .gte('date', todayStart)
        .lt('date', todayEndISO),

      // Queue stats
      supabaseAdmin
        .from('reception_queue')
        .select('id, status', { count: 'exact' })
        .gte('created_at', todayStart)
        .lt('created_at', todayEndISO),

      // Upcoming appointments (next 2 hours)
      supabaseAdmin
        .from('appointments')
        .select('id, date, patient_name, phone')
        .gte('date', new Date().toISOString())
        .lte('date', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString())
        .eq('status', 'confirmed')
        .order('date', { ascending: true })
        .limit(10)
    ])

    // Calculate queue stats
    const queueData = queueStats.data || []
    const waiting = queueData.filter((q: any) => q.status === 'waiting' || q.status === 'checked_in').length
    const inProgress = queueData.filter((q: any) => q.status === 'in_progress').length
    const completed = queueData.filter((q: any) => q.status === 'completed').length

    // Calculate appointment stats
    const appointmentsData = appointmentsToday.data || []
    const confirmedAppointments = appointmentsData.filter((a: any) => a.status === 'confirmed').length
    const pendingAppointments = appointmentsData.filter((a: any) => a.status === 'pending').length

    return NextResponse.json(successResponse({
      patients: {
        newToday: newPatientsToday.count || 0,
        total: totalPatients.count || 0
      },
      appointments: {
        today: appointmentsToday.count || 0,
        confirmed: confirmedAppointments,
        pending: pendingAppointments
      },
      queue: {
        total: queueStats.count || 0,
        waiting,
        inProgress,
        completed
      },
      upcomingAppointments: upcomingAppointments.data || []
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
