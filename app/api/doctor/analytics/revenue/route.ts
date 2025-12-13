/**
 * Doctor Revenue Analytics API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/analytics/revenue
 * Get revenue analytics for a doctor
 */
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

    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get('doctor_id') || user.id
    const period = searchParams.get('period') || 'month' // 'week', 'month', 'year'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // Get this period revenue
    const { data: thisPeriodInvoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, paid_amount, status')
      .eq('doctor_id', doctorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const thisPeriod = thisPeriodInvoices?.reduce(
      (sum, inv) => sum + (Number(inv.paid_amount) || 0),
      0
    ) || 0

    // Get previous period revenue
    const prevStartDate = new Date(startDate)
    const prevEndDate = new Date(startDate)
    
    switch (period) {
      case 'week':
        prevStartDate.setDate(prevStartDate.getDate() - 7)
        break
      case 'month':
        prevStartDate.setMonth(prevStartDate.getMonth() - 1)
        prevEndDate.setMonth(prevEndDate.getMonth() - 1)
        break
      case 'year':
        prevStartDate.setFullYear(prevStartDate.getFullYear() - 1)
        prevEndDate.setFullYear(prevEndDate.getFullYear() - 1)
        break
    }

    const { data: prevPeriodInvoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, paid_amount, status')
      .eq('doctor_id', doctorId)
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString())

    const lastPeriod = prevPeriodInvoices?.reduce(
      (sum, inv) => sum + (Number(inv.paid_amount) || 0),
      0
    ) || 0

    // Calculate growth
    const growth = lastPeriod > 0
      ? Math.round(((thisPeriod - lastPeriod) / lastPeriod) * 100 * 10) / 10
      : thisPeriod > 0 ? 100 : 0

    // Total revenue (all time)
    const { data: allInvoices } = await supabaseAdmin
      .from('invoices')
      .select('paid_amount')
      .eq('doctor_id', doctorId)
      .eq('status', 'paid')

    const total = allInvoices?.reduce(
      (sum, inv) => sum + (Number(inv.paid_amount) || 0),
      0
    ) || 0

    return NextResponse.json({
      success: true,
      data: {
        total,
        thisMonth: period === 'month' ? thisPeriod : 0,
        lastMonth: period === 'month' ? lastPeriod : 0,
        growth,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/analytics/revenue' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

