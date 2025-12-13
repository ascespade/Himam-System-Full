/**
 * GET /api/doctor/clinic/settings
 * Get clinic settings
 * 
 * PUT /api/doctor/clinic/settings
 * Update clinic settings
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

    const { data, error } = await supabaseAdmin
      .from('clinic_settings')
      .select('*')
      .eq('doctor_id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Return default settings if not found
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          doctor_id: user.id,
          is_open: false,
          daily_capacity: 20,
          current_queue_count: 0,
          appointment_buffer_minutes: 15,
          allow_same_day_booking: true,
          allow_online_booking: true,
          booking_advance_days: 30,
          consultation_fee: 0,
          follow_up_fee: 0,
          notify_on_new_appointment: true,
          notify_on_cancellation: true,
          notify_before_appointment_minutes: 30,
        }
      })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/clinic/settings' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
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

    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('clinic_settings')
      .select('id')
      .eq('doctor_id', user.id)
      .maybeSingle()

    let result
    if (existing) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('clinic_settings')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('doctor_id', user.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create
      const { data, error } = await supabaseAdmin
        .from('clinic_settings')
        .insert({
          doctor_id: user.id,
          ...body,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'تم تحديث إعدادات العيادة بنجاح'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/clinic/settings' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

