import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/appointments
 * Get today's appointments for the logged-in doctor
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

    // Support date range query for calendar
    const searchParams = req.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const offset = (page - 1) * limit

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from('appointments')
      .select('id, patient_id, doctor_id, date, time, duration, appointment_type, status, notes, created_at, updated_at, patients(name, phone)', { count: 'exact' })
      .eq('doctor_id', user.id)

    if (start && end) {
      // Calendar view - get appointments in date range
      query = query
        .gte('date', start)
        .lte('date', end)
    } else {
      // Default: today's appointments
      const today = new Date().toISOString().split('T')[0]
      query = query
        .gte('date', `${today}T00:00:00`)
        .lt('date', `${today}T23:59:59`)
    }

    const { data, error, count } = await query.order('date', { ascending: true }).range(offset, offset + limit - 1)

    if (error) throw error

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/appointments' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')
