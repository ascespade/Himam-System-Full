import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/patient-visit
 * Get current patient visit for doctor (from reception confirmation)
 * يستخدم لتحديد المريض تلقائياً في PatientContext
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

    // Try to get pending visit from patient_visits table
    // If table doesn't exist, try reception_queue as fallback
    let visits: any[] | null = null
    let visit: Record<string, unknown> | null = null
    let error: Record<string, unknown> | null = null

    try {
      // Select specific columns for better performance
      const result = await supabaseAdmin
        .from('patient_visits')
        .select(`
          id, patient_id, doctor_id, appointment_id, visit_date, status, notes, confirmed_to_doctor_time, doctor_seen_time, visit_completed_time, created_at, updated_at,
          patients (id, name, phone),
          appointments (id, date, time, status)
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'confirmed_to_doctor')
        .order('confirmed_to_doctor_time', { ascending: false })
        .limit(1)

      visits = result.data
      error = result.error as Record<string, unknown> | null
    } catch (tableError: unknown) {
      // Table doesn't exist, try reception_queue as fallback
      const errorCode = tableError && typeof tableError === 'object' && 'code' in tableError ? tableError.code : null
      const errorMessage = tableError instanceof Error ? tableError.message : String(tableError)
      if (errorCode === '42P01' || errorMessage.includes('does not exist')) {
        try {
          // Select specific columns for better performance
          const queueResult = await supabaseAdmin
            .from('reception_queue')
            .select(`
              id, patient_id, appointment_id, queue_number, status, checked_in_at, confirmed_at, notes, created_at, updated_at,
              patients (id, name, phone),
              appointments (id, date, time, status)
            `)
            .eq('doctor_id', user.id)
            .eq('status', 'confirmed')
            .order('confirmed_at', { ascending: false })
            .limit(1)

          visits = queueResult.data
          error = queueResult.error as Record<string, unknown> | null
        } catch (queueError: unknown) {
          // Both tables don't exist, return empty
          return NextResponse.json({
            success: true,
            data: null,
            message: 'لا يوجد مريض في انتظارك حالياً'
          })
        }
      } else {
        throw tableError
      }
    }

    if (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching patient visits', error, { endpoint: '/api/doctor/patient-visit' })
      // If it's a table not found error, return empty
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorCode === '42P01' || (typeof errorMessage === 'string' && errorMessage.includes('does not exist'))) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'لا يوجد مريض في انتظارك حالياً'
        })
      }
      // For other errors, return empty instead of throwing
      return NextResponse.json({
        success: true,
        data: null,
        message: 'لا يوجد مريض في انتظارك حالياً'
      })
    }

    visit = visits && visits.length > 0 ? visits[0] : null

    if (!visit) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'لا يوجد مريض في انتظارك حالياً'
      })
    }

    // Try to mark as seen by doctor (ignore errors if table doesn't exist)
    try {
      await supabaseAdmin
        .from('patient_visits')
        .update({
          status: 'with_doctor',
          doctor_seen_time: new Date().toISOString()
        })
        .eq('id', visit.id)
    } catch (updateError: unknown) {
      // Ignore update errors (table might not exist or field might not exist)
      const errorMessage = updateError instanceof Error ? updateError.message : String(updateError)
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('Could not update visit status', { error: errorMessage, visitId: visit?.id, endpoint: '/api/doctor/patient-visit' })
    }

    return NextResponse.json({
      success: true,
      data: {
        visit,
        patient: visit.patients || visit.patient_id ? { id: visit.patient_id } : null,
        appointment: visit.appointments || visit.appointment_id ? { id: visit.appointment_id } : null,
        should_auto_select: true // Frontend will use this to auto-select patient
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/patient-visit' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * PUT /api/doctor/patient-visit/[id]
 * Update visit status (complete visit)
 */
export const PUT = withRateLimit(async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status, notes } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      if (status === 'completed') {
        updateData.visit_completed_time = new Date().toISOString()
      }
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabaseAdmin
      .from('patient_visits')
      .update(updateData)
      .eq('id', params.id)
      .eq('doctor_id', user.id)
      // Select specific columns for better performance
      .select('id, patient_id, doctor_id, appointment_id, visit_date, status, notes, confirmed_to_doctor_time, doctor_seen_time, visit_completed_time, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/patient-visit' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

