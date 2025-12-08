import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      data: {
        appointments: {
          pending: pendingAppointments || 0,
          today: todayAppointments || 0
        },
        notifications: {
          unread: unreadNotifications || 0
        },
        patients: {
          total: totalPatients || 0
        },
        doctors: {
          total: totalDoctors || 0
        },
        invoices: {
          pending: pendingInvoices || 0
        },
        revenue: {
          today: todayRevenue
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

