/**
 * POST /api/doctor/clinic/close
 * Close clinic (set is_open = false)
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

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

    const { data, error } = await supabaseAdmin
      .from('clinic_settings')
      .update({
        is_open: false,
        updated_at: new Date().toISOString(),
      })
      .eq('doctor_id', user.id)
      // Select specific columns for better performance
      .select('id, doctor_id, is_open, daily_capacity, current_queue_count, appointment_buffer_minutes, allow_same_day_booking, allow_online_booking, booking_advance_days, consultation_fee, follow_up_fee, notify_on_new_appointment, notify_on_cancellation, notify_before_appointment_minutes, created_at, updated_at')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || { is_open: false },
      message: 'تم إغلاق العيادة بنجاح'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/clinic/close' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

