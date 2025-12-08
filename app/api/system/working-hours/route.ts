/**
 * Working Hours API
 * Centralized working hours management
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/system/working-hours
 * Get working hours
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
      .from('working_hours')
      .select('*')
      .order('day_of_week', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching working hours:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/system/working-hours
 * Update working hours (admin only)
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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { working_hours } = body // Array of { day_of_week, start_time, end_time, is_working_day, break_start, break_end }

    if (!Array.isArray(working_hours)) {
      return NextResponse.json(
        { success: false, error: 'working_hours must be an array' },
        { status: 400 }
      )
    }

    const updates = working_hours.map((wh) =>
      supabaseAdmin
        .from('working_hours')
        .upsert({
          day_of_week: wh.day_of_week,
          start_time: wh.start_time,
          end_time: wh.end_time,
          is_working_day: wh.is_working_day !== undefined ? wh.is_working_day : true,
          break_start: wh.break_start || null,
          break_end: wh.break_end || null,
          is_active: wh.is_active !== undefined ? wh.is_active : true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'day_of_week',
        })
    )

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: 'Working hours updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating working hours:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

