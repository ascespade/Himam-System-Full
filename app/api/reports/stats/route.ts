import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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

    // 1. Financial Stats
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('total, status, created_at')

    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.total : 0), 0) || 0
    const pendingRevenue = invoices?.reduce((sum, inv) => sum + (inv.status === 'pending' ? inv.total : 0), 0) || 0

    // 2. Appointment Stats
    const { count: totalAppointments } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })

    const { count: todayAppointments } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('date', new Date().toISOString().split('T')[0])

    // 3. Patient Stats
    const { count: totalPatients } = await supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact', head: true })

    // 4. Doctor Stats
    const { data: doctors } = await supabaseAdmin
      .from('users')
      .select('id, name, role')
      .eq('role', 'doctor')

    return NextResponse.json({
      success: true,
      data: {
        financials: {
          totalRevenue,
          pendingRevenue,
          invoiceCount: invoices?.length || 0
        },
        appointments: {
          total: totalAppointments || 0,
          today: todayAppointments || 0
        },
        patients: {
          total: totalPatients || 0
        },
        doctorsCount: doctors?.length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
