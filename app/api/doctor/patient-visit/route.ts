import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/patient-visit
 * Get current patient visit for doctor (from reception confirmation)
 * يستخدم لتحديد المريض تلقائياً في PatientContext
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

    // Try to get pending visit from patient_visits table
    // If table doesn't exist, try reception_queue as fallback
    let visits: any[] | null = null
    let visit: any = null
    let error: any = null

    try {
      const result = await supabaseAdmin
        .from('patient_visits')
        .select(`
          *,
          patients (*),
          appointments (*)
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'confirmed_to_doctor')
        .order('confirmed_to_doctor_time', { ascending: false })
        .limit(1)

      visits = result.data
      error = result.error
    } catch (tableError: any) {
      // Table doesn't exist, try reception_queue as fallback
      if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
        try {
          const queueResult = await supabaseAdmin
            .from('reception_queue')
            .select(`
              *,
              patients (*),
              appointments (*)
            `)
            .eq('doctor_id', user.id)
            .eq('status', 'confirmed')
            .order('confirmed_at', { ascending: false })
            .limit(1)

          visits = queueResult.data
          error = queueResult.error
        } catch (queueError: any) {
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
      console.error('Error fetching patient visits:', error)
      // If it's a table not found error, return empty
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
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
    } catch (updateError: any) {
      // Ignore update errors (table might not exist or field might not exist)
      console.warn('Could not update visit status:', updateError.message)
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
  } catch (error: any) {
    console.error('Error fetching patient visit:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/doctor/patient-visit/[id]
 * Update visit status (complete visit)
 */
export async function PUT(
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

    const updateData: any = {
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
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error updating patient visit:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

