/**
 * GET /api/doctor/patients/[id]/progress
 * Get patient progress tracking data
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

export const GET = withRateLimit(async function GET(
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

    // Get treatment plans with progress - select specific columns
    const { data: treatmentPlans } = await supabaseAdmin
      .from('treatment_plans')
      .select('id, patient_id, doctor_id, title, description, start_date, end_date, status, goals, progress_percentage, notes, created_at, updated_at')
      .eq('patient_id', params.id)
      .eq('doctor_id', user.id)
      .order('start_date', { ascending: false })

    // Get sessions for progress tracking - select specific columns
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('id, patient_id, doctor_id, appointment_id, date, duration, session_type, status, chief_complaint, assessment, plan, notes, created_at, updated_at')
      .eq('patient_id', params.id)
      .eq('doctor_id', user.id)
      .order('date', { ascending: false })
      .limit(50)

    // Get progress entries if table exists - select specific columns
    let progressEntries: Array<Record<string, unknown>> = []
    try {
      const { data: progress } = await supabaseAdmin
        .from('progress_tracking')
        .select('id, patient_id, doctor_id, metric_name, metric_value, notes, created_at, updated_at')
        .eq('patient_id', params.id)
        .order('created_at', { ascending: false })
        .limit(50)
      progressEntries = progress || []
    } catch (e) {
      // Table might not exist
    }

    // Calculate overall progress
    const activePlans = treatmentPlans?.filter(p => p.status === 'active') || []
    const totalGoals = activePlans.reduce((sum, plan) => {
      const goals = Array.isArray(plan.goals) ? plan.goals : []
      return sum + goals.length
    }, 0)
    const completedGoals = activePlans.reduce((sum, plan) => {
      const goals = Array.isArray(plan.goals) ? plan.goals : []
      return sum + goals.filter((g: Record<string, unknown>) => g.status === 'completed').length
    }, 0)
    const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        treatmentPlans: treatmentPlans || [],
        sessions: sessions || [],
        progressEntries: progressEntries,
        statistics: {
          totalPlans: treatmentPlans?.length || 0,
          activePlans: activePlans.length,
          totalGoals,
          completedGoals,
          overallProgress,
          totalSessions: sessions?.length || 0
        }
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/patients/[id]/progress' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

