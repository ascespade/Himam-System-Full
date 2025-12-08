import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/schedule
 * Get doctor's schedule
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

    const { data, error } = await supabaseAdmin
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', user.id)
      .order('day_of_week', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/schedule
 * Create new schedule
 */
export async function POST(req: NextRequest) {
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
  } catch (error: any) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

