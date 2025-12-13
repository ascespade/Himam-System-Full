/**
 * GET /api/doctor/queue
 * Get reception queue for doctor
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

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

    // Try patient_visits first, fallback to reception_queue
    let queueData: Array<Record<string, unknown>> = []
    let error: Record<string, unknown> | null = null

    try {
      // Select specific columns for better performance
      const visitsResult = await supabaseAdmin
        .from('patient_visits')
        .select(`
          id, patient_id, doctor_id, appointment_id, visit_date, status, notes, created_at, updated_at,
          patients (id, name, phone),
          appointments (id, date, time, status)
        `)
        .eq('doctor_id', user.id)
        .in('status', ['pending', 'confirmed_to_doctor'])
        .order('created_at', { ascending: true })

      if (!visitsResult.error && visitsResult.data) {
        queueData = visitsResult.data
      } else {
        error = visitsResult.error ? (visitsResult.error as unknown as Record<string, unknown>) : null as Record<string, unknown> | null
      }
    } catch (err: unknown) {
      // Table doesn't exist, try reception_queue
      try {
        // Select specific columns for better performance
        const queueResult = await supabaseAdmin
          .from('reception_queue')
          .select(`
            id, patient_id, appointment_id, queue_number, status, checked_in_at, notes, created_at, updated_at,
            patients (id, name, phone),
            appointments (id, date, time, status)
          `)
          .eq('doctor_id', user.id)
          .in('status', ['pending', 'confirmed'])
          .order('created_at', { ascending: true })

        if (!queueResult.error && queueResult.data) {
          queueData = queueResult.data
        }
      } catch (queueErr: unknown) {
        // Both tables don't exist
        return NextResponse.json({
          success: true,
          data: [],
          message: 'لا يوجد مرضى في الانتظار'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: queueData,
      count: queueData.length
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/queue' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

