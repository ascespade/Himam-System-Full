/**
 * Doctor Performance Analytics API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/analytics/performance
 * Get comprehensive performance metrics for a doctor
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
    const periodStart = searchParams.get('period_start') || new Date(new Date().setDate(1)).toISOString().split('T')[0] // First day of current month
    const periodEnd = searchParams.get('period_end') || new Date().toISOString().split('T')[0] // Today

    // Verify access (doctor can only view their own, admin can view any)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'admin' && userData.role !== 'doctor')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (userData.role === 'doctor' && doctorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Check if metrics are cached
    const { data: cachedMetrics } = await supabaseAdmin
      .from('doctor_performance_metrics')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .single()

    if (cachedMetrics && new Date(cachedMetrics.calculated_at) > new Date(Date.now() - 3600000)) {
      // Return cached if less than 1 hour old
      return NextResponse.json({ success: true, data: cachedMetrics, cached: true })
    }

    // Calculate metrics
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)
    endDate.setHours(23, 59, 59, 999)

    // 1. Patient Statistics
    const { count: totalPatients } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .is('end_date', null)

    const { count: newPatients } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .gte('start_date', periodStart)
      .lte('start_date', periodEnd)

    // 2. Session Statistics
    const { data: sessions, count: totalSessions } = await supabaseAdmin
      .from('sessions')
      .select('id, status, date, duration_minutes')
      .eq('doctor_id', doctorId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())

    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
    const cancelledSessions = sessions?.filter(s => s.status === 'cancelled').length || 0
    const noShowSessions = sessions?.filter(s => s.status === 'no_show').length || 0

    const avgSessionDuration = sessions && sessions.length > 0
      ? sessions
          .filter(s => s.duration_minutes)
          .reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.filter(s => s.duration_minutes).length
      : 0

    // 3. Treatment Plans Statistics
    const { count: totalTreatmentPlans } = await supabaseAdmin
      .from('treatment_plans')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const { count: activeTreatmentPlans } = await supabaseAdmin
      .from('treatment_plans')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'active')

    const { count: completedTreatmentPlans } = await supabaseAdmin
      .from('treatment_plans')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())

    // 4. Revenue (from invoices linked to sessions)
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, paid_amount, status')
      .eq('doctor_id', doctorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const revenue = invoices?.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0

    // 5. Patient Satisfaction (if available)
    // Calculate average rating from session feedback if exists
    let patientSatisfactionScore: number | null = null
    try {
      const { data: feedbackData } = await supabaseAdmin
        .from('sessions')
        .select('patient_satisfaction_rating')
        .eq('doctor_id', doctorId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .not('patient_satisfaction_rating', 'is', null)

      if (feedbackData && feedbackData.length > 0) {
        const ratings = feedbackData
          .map(s => s.patient_satisfaction_rating)
          .filter(r => r !== null && r !== undefined)
          .map(Number)

        if (ratings.length > 0) {
          patientSatisfactionScore = Math.round(
            (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10
          ) / 10
        }
      }
    } catch (feedbackError) {
      // Ignore if feedback column doesn't exist yet
      console.warn('Patient satisfaction feedback not available:', feedbackError)
    }

    // Build metrics object
    const metrics = {
      doctor_id: doctorId,
      period_start: periodStart,
      period_end: periodEnd,
      total_patients: totalPatients || 0,
      active_patients: totalPatients || 0,
      new_patients: newPatients || 0,
      total_sessions: totalSessions || 0,
      completed_sessions: completedSessions,
      cancelled_sessions: cancelledSessions,
      no_show_sessions: noShowSessions,
      avg_session_duration_minutes: Math.round(avgSessionDuration * 10) / 10,
      total_treatment_plans: totalTreatmentPlans || 0,
      active_treatment_plans: activeTreatmentPlans || 0,
      completed_treatment_plans: completedTreatmentPlans || 0,
      patient_satisfaction_score: patientSatisfactionScore,
      revenue: revenue,
      calculated_at: new Date().toISOString(),
    }

    // Cache metrics
    await supabaseAdmin
      .from('doctor_performance_metrics')
      .upsert(metrics, {
        onConflict: 'doctor_id,period_start,period_end',
      })

    return NextResponse.json({ success: true, data: metrics, cached: false })
  } catch (error: any) {
    console.error('Error calculating doctor performance metrics:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

