import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimitCheck, addRateLimitHeadersToResponse } from '@/core/api/middleware/applyRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/patients/[id]/quick-stats
 * Get quick statistics for a patient (for context panel)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse
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

    // Verify doctor has access to this patient
    const { data: relationship } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select('id')
      .eq('doctor_id', user.id)
      .eq('patient_id', params.id)
      .is('end_date', null)
      .single()

    if (!relationship) {
      return NextResponse.json({ success: false, error: 'Patient not found or unauthorized' }, { status: 404 })
    }

    // Get quick stats in parallel
    const [
      { count: totalSessions },
      { count: activePlans },
      { data: nextAppointment },
      { data: lastSession }
    ] = await Promise.all([
      supabaseAdmin
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', params.id)
        .eq('doctor_id', user.id),
      supabaseAdmin
        .from('treatment_plans')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', params.id)
        .eq('doctor_id', user.id)
        .eq('status', 'active'),
      supabaseAdmin
        .from('appointments')
        .select('date')
        .eq('patient_id', params.id)
        .eq('doctor_id', user.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1)
        .single(),
      supabaseAdmin
        .from('sessions')
        .select('date')
        .eq('patient_id', params.id)
        .eq('doctor_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single()
    ])

    const response = NextResponse.json({
      success: true,
      data: {
        total_sessions: totalSessions || 0,
        active_treatment_plans: activePlans || 0,
        next_appointment: nextAppointment?.date || null,
        last_session: lastSession?.date || null
      }
    })
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/patients/[id]/quick-stats' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

