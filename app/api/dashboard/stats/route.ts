import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role || 'admin'
    const { searchParams } = new URL(req.url)
    const requestedRole = searchParams.get('role') || role

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. Pending Appointments Count
    const { count: pendingAppointments } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // 2. Today's Appointments
    const { count: todayAppointments } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('date', today.toISOString())
      .lt('date', tomorrow.toISOString())

    // 3. Unread Notifications Count
    const { count: unreadNotifications } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    // 4. Total Patients
    const { count: totalPatients } = await supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact', head: true })

    // 5. Total Doctors
    const { count: totalDoctors } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'doctor')

    // 6. Pending Invoices
    const { count: pendingInvoices } = await supabaseAdmin
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // 7. Today's Revenue (paid invoices)
    const { data: todayInvoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, paid_amount')
      .eq('status', 'paid')
      .gte('paid_at', today.toISOString())
      .lt('paid_at', tomorrow.toISOString())

    const todayRevenue = todayInvoices?.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0

    // Role-specific stats
    let roleStats: Record<string, unknown> = {}

    if (requestedRole === 'admin') {
      roleStats = {
        total_patients: totalPatients || 0,
        total_doctors: totalDoctors || 0,
        today_appointments: todayAppointments || 0,
        pending_claims: 0, // Will be calculated
        revenue_today: todayRevenue,
        revenue_month: 0 // Will be calculated
      }

      // Pending claims
      const { count: pendingClaims } = await supabaseAdmin
        .from('insurance_claims_enhanced')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      roleStats.pending_claims = pendingClaims || 0

      // Monthly revenue
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const { data: monthInvoices } = await supabaseAdmin
        .from('invoices')
        .select('paid_amount')
        .eq('status', 'paid')
        .gte('paid_at', monthStart.toISOString())

      roleStats.revenue_month = monthInvoices?.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0

    } else if (requestedRole === 'doctor') {
      // Doctor-specific stats
      const { count: myPatients } = await supabaseAdmin
        .from('doctor_patient_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .is('end_date', null)

      const { count: todaySessions } = await supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('status', 'scheduled')
        .gte('date', today.toISOString())
        .lt('date', tomorrow.toISOString())

      const { count: pendingPlans } = await supabaseAdmin
        .from('treatment_plans')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('status', 'active')

      roleStats = {
        my_patients: myPatients || 0,
        today_sessions: todaySessions || 0,
        pending_treatment_plans: pendingPlans || 0,
        unread_messages: 0 // Will be calculated from chat
      }

    } else if (requestedRole === 'reception') {
      const { count: queueToday } = await supabaseAdmin
        .from('reception_queue')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      const { count: newPatientsToday } = await supabaseAdmin
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      roleStats = {
        queue_today: queueToday || 0,
        appointments_today: todayAppointments || 0,
        new_patients_today: newPatientsToday || 0
      }

    } else if (requestedRole === 'insurance') {
      const { count: approvedToday } = await supabaseAdmin
        .from('insurance_claims_enhanced')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('approved_at', today.toISOString())
        .lt('approved_at', tomorrow.toISOString())

      const { count: rejectedToday } = await supabaseAdmin
        .from('insurance_claims_enhanced')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('updated_at', today.toISOString())
        .lt('updated_at', tomorrow.toISOString())

      const { data: pendingClaimsData } = await supabaseAdmin
        .from('insurance_claims_enhanced')
        .select('total_amount')
        .eq('status', 'pending')

      const totalAmountPending = pendingClaimsData?.reduce((sum, claim) => 
        sum + (Number(claim.total_amount) || 0), 0) || 0

      roleStats = {
        pending_claims: pendingAppointments || 0,
        approved_today: approvedToday || 0,
        rejected_today: rejectedToday || 0,
        total_amount_pending: totalAmountPending
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...roleStats,
        // Common stats
        appointments: {
          pending: pendingAppointments || 0,
          today: todayAppointments || 0
        },
        notifications: {
          unread: unreadNotifications || 0
        }
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/dashboard/stats' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

