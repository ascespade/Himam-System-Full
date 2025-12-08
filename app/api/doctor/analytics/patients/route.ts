/**
 * Doctor Patients Analytics API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/analytics/patients
 * Get patient analytics for a doctor
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

    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get('doctor_id') || user.id

    // Get total patients
    const { count: totalPatients } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .is('end_date', null)

    // Get active patients (have recent sessions)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: activePatients } = await supabaseAdmin
      .from('sessions')
      .select('patient_id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .gte('date', thirtyDaysAgo.toISOString())

    // Get new patients (last 30 days)
    const { count: newPatients } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .gte('start_date', thirtyDaysAgo.toISOString())

    // Calculate retention rate
    const retentionRate = totalPatients && totalPatients > 0
      ? Math.round((Number(activePatients || 0) / totalPatients) * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        total: totalPatients || 0,
        active: activePatients || 0,
        new: newPatients || 0,
        retentionRate,
      },
    })
  } catch (error: any) {
    console.error('Error fetching patient analytics:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

