import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reception/queue
 * Get reception queue for today
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

    const searchParams = req.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const status = searchParams.get('status')

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from('reception_queue')
      .select(`
        id, patient_id, appointment_id, queue_number, status, checked_in_at, notes, created_at, updated_at,
        patients (
          id,
          name,
          phone
        ),
        appointments (
          id,
          date,
          specialist
        )
      `)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    query = query.order('queue_number', { ascending: true })

    const { data, error } = await query

    if (error) throw error

    // Transform data
    const transformed = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      patient_name: (item.patients as Record<string, unknown>)?.name || 'غير معروف',
      patient_phone: (item.patients as Record<string, unknown>)?.phone || '',
      appointment_time: (item.appointments as Record<string, unknown>)?.date,
      doctor_name: (item.appointments as Record<string, unknown>)?.specialist
    }))

    return NextResponse.json({
      success: true,
      data: transformed
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب الطابور'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching queue', error, { endpoint: '/api/reception/queue' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/reception/queue
 * Add patient to queue
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
    const { patient_id, appointment_id, notes } = body

    if (!patient_id) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Get next queue number for today
    const today = new Date().toISOString().split('T')[0]
    const { data: lastQueue } = await supabaseAdmin
      .from('reception_queue')
      .select('queue_number')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .order('queue_number', { ascending: false })
      .limit(1)
      .single()

    const nextQueueNumber = lastQueue?.queue_number ? lastQueue.queue_number + 1 : 1

    const { data, error } = await supabaseAdmin
      .from('reception_queue')
      .insert({
        patient_id,
        appointment_id: appointment_id || null,
        queue_number: nextQueueNumber,
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        notes: notes || null
      })
      .select('id, patient_id, appointment_id, queue_number, status, checked_in_at, notes, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة عنصر للطابور'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error adding to queue', error, { endpoint: '/api/reception/queue' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

