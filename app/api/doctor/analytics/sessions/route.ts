/**
 * Doctor Sessions Analytics API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/analytics/sessions
 * Get session analytics for a doctor
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

    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get('doctor_id') || user.id
    const period = searchParams.get('period') || 'month'

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

    // Get sessions for the period
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('date, status')
      .eq('doctor_id', doctorId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())

    // Group by week/day/month
    const weekly: { day: string; count: number }[] = []
    const monthly: { month: string; count: number }[] = []

    if (period === 'week') {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      const dayCounts: Record<number, number> = {}
      
      sessions?.forEach(session => {
        const date = new Date(session.date)
        const dayOfWeek = date.getDay()
        dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1
      })

      for (let i = 0; i < 7; i++) {
        weekly.push({
          day: days[i],
          count: dayCounts[i] || 0,
        })
      }
    } else if (period === 'month' || period === 'year') {
      const monthCounts: Record<string, number> = {}
      
      sessions?.forEach(session => {
        const date = new Date(session.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
      })

      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      
      Object.entries(monthCounts).forEach(([key, count]) => {
        const [year, month] = key.split('-')
        monthly.push({
          month: `${months[parseInt(month) - 1]} ${year}`,
          count,
        })
      })
      
      monthly.sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        weekly: weekly.length > 0 ? weekly : [],
        monthly: monthly.length > 0 ? monthly : [],
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/analytics/sessions' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

