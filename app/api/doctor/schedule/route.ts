import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/schedule
 * Get doctor's schedule
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

    // Select specific columns for better performance
    const { data, error } = await supabaseAdmin
      .from('doctor_schedules')
      .select('id, doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_active, created_at, updated_at')
      .eq('doctor_id', user.id)
      .order('day_of_week', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/schedule' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/doctor/schedule
 * Create new schedule
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_active } = body

    // Validate
    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Check if schedule already exists for this day
    const { data: existing } = await supabaseAdmin
      .from('doctor_schedules')
      .select('id')
      .eq('doctor_id', user.id)
      .eq('day_of_week', day_of_week)
      .single()

    if (existing) {
      return NextResponse.json({ success: false, error: 'Schedule already exists for this day' }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from('doctor_schedules')
      .insert({
        doctor_id: user.id,
        day_of_week,
        start_time,
        end_time,
        break_start: break_start || null,
        break_end: break_end || null,
        slot_duration: slot_duration || 30,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/schedule' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

