/**
 * Supervisor Quality API
 * Quality metrics and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { supabaseAdmin } from '@/lib'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/supervisor/quality
 * Get quality metrics and analytics
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
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify user is supervisor or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['supervisor', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        errorResponse('Forbidden - Supervisor access only'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const doctorId = searchParams.get('doctor_id')
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]

    let query = supabaseAdmin
      .from('supervisor_quality_metrics')
      .select(`
        *,
        users!supervisor_quality_metrics_doctor_id_fkey (
          id,
          name,
          email
        )
      `)
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: false })

    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    const { data: metrics, error } = await query

    if (error) throw error

    // Calculate aggregate statistics
    const totalSessions = metrics?.reduce((sum, m) => sum + (m.total_sessions || 0), 0) || 0
    const reviewedSessions = metrics?.reduce((sum, m) => sum + (m.reviewed_sessions || 0), 0) || 0
    const avgQuality = metrics && metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (Number(m.quality_score) || 0), 0) / metrics.length
      : 0
    const avgCompliance = metrics && metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (Number(m.compliance_score) || 0), 0) / metrics.length
      : 0
    const totalCriticalCases = metrics?.reduce((sum, m) => sum + (m.critical_cases_count || 0), 0) || 0
    const totalCorrections = metrics?.reduce((sum, m) => sum + (m.corrections_required || 0), 0) || 0

    return NextResponse.json(successResponse({
      metrics: metrics || [],
      summary: {
        totalSessions,
        reviewedSessions,
        reviewRate: totalSessions > 0 ? Math.round((reviewedSessions / totalSessions) * 100) : 0,
        averageQualityScore: Math.round(avgQuality * 100) / 100,
        averageComplianceScore: Math.round(avgCompliance * 100) / 100,
        totalCriticalCases,
        totalCorrections
      },
      period: {
        startDate,
        endDate
      }
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}, 'strict')
