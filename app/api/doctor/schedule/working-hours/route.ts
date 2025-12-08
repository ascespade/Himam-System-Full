/**
 * GET /api/doctor/schedule/working-hours
 * Get working hours for doctor
 * 
 * POST /api/doctor/schedule/working-hours
 * Save working hours (weekly/monthly)
 */
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

    const { searchParams } = new URL(req.url)
    const validFrom = searchParams.get('valid_from')
    const validUntil = searchParams.get('valid_until')

    let query = supabaseAdmin
      .from('doctor_working_hours')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (validFrom) {
      query = query.or(`valid_from.is.null,valid_from.lte.${validFrom}`)
    }
    if (validUntil) {
      query = query.or(`valid_until.is.null,valid_until.gte.${validUntil}`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('Error fetching working hours:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

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
    const { workingHours, replaceExisting } = body

    if (!Array.isArray(workingHours)) {
      return NextResponse.json(
        { success: false, error: 'workingHours must be an array' },
        { status: 400 }
      )
    }

    // If replaceExisting, delete old entries for the date range
    if (replaceExisting && workingHours.length > 0) {
      const firstHour = workingHours[0]
      if (firstHour.valid_from && firstHour.valid_until) {
        await supabaseAdmin
          .from('doctor_working_hours')
          .delete()
          .eq('doctor_id', user.id)
          .gte('valid_from', firstHour.valid_from)
          .lte('valid_until', firstHour.valid_until)
      }
    }

    // Insert new working hours
    const hoursToInsert = workingHours.map((hour: any) => ({
      doctor_id: user.id,
      day_of_week: hour.day_of_week,
      start_time: hour.start_time,
      end_time: hour.end_time,
      break_start: hour.break_start || null,
      break_end: hour.break_end || null,
      slot_duration_minutes: hour.slot_duration_minutes || 30,
      max_appointments_per_day: hour.max_appointments_per_day || 20,
      is_active: hour.is_active !== undefined ? hour.is_active : true,
      is_working_day: hour.is_working_day !== undefined ? hour.is_working_day : true,
      valid_from: hour.valid_from || null,
      valid_until: hour.valid_until || null,
      notes: hour.notes || null,
    }))

    const { data, error } = await supabaseAdmin
      .from('doctor_working_hours')
      .insert(hoursToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'تم حفظ أوقات العمل بنجاح'
    })
  } catch (error: any) {
    console.error('Error saving working hours:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

