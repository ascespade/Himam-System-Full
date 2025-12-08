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

    // Get pending visit (confirmed but not seen yet)
    const { data: visit, error } = await supabaseAdmin
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
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!visit) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'لا يوجد مريض في انتظارك حالياً'
      })
    }

    // Mark as seen by doctor
    await supabaseAdmin
      .from('patient_visits')
      .update({
        status: 'with_doctor',
        doctor_seen_time: new Date().toISOString()
      })
      .eq('id', visit.id)

    return NextResponse.json({
      success: true,
      data: {
        visit,
        patient: visit.patients,
        appointment: visit.appointments,
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

