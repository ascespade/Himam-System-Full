/**
 * Supervisor Dashboard API
 * Comprehensive statistics and overview for medical supervisor
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/supervisor/dashboard
 * Get comprehensive dashboard statistics
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
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end_date') || new Date().toISOString()

    // Get comprehensive statistics
    const [
      totalSessions,
      reviewedSessions,
      pendingReviews,
      criticalCases,
      qualityMetrics,
      doctorStats
    ] = await Promise.all([
      // Total sessions in period
      supabaseAdmin
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gte('date', startDate)
        .lte('date', endDate),

      // Reviewed sessions
      supabaseAdmin
        .from('supervisor_reviews')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'approved'),

      // Pending reviews
      supabaseAdmin
        .from('supervisor_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Critical cases
      supabaseAdmin
        .from('critical_cases')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open'),

      // Quality metrics (average)
      supabaseAdmin
        .from('supervisor_quality_metrics')
        .select('quality_score, compliance_score')
        .gte('metric_date', startDate.split('T')[0])
        .lte('metric_date', endDate.split('T')[0]),

      // Doctor statistics
      supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'doctor')
    ])

    const avgQuality = qualityMetrics.data && qualityMetrics.data.length > 0
      ? qualityMetrics.data.reduce((sum, m) => sum + (Number(m.quality_score) || 0), 0) / qualityMetrics.data.length
      : 0

    const avgCompliance = qualityMetrics.data && qualityMetrics.data.length > 0
      ? qualityMetrics.data.reduce((sum, m) => sum + (Number(m.compliance_score) || 0), 0) / qualityMetrics.data.length
      : 0

    return NextResponse.json(successResponse({
      overview: {
        totalSessions: totalSessions.count || 0,
        reviewedSessions: reviewedSessions.count || 0,
        pendingReviews: pendingReviews.count || 0,
        criticalCases: criticalCases.count || 0,
        activeDoctors: doctorStats.data?.length || 0
      },
      quality: {
        averageQualityScore: Math.round(avgQuality * 100) / 100,
        averageComplianceScore: Math.round(avgCompliance * 100) / 100,
        reviewRate: totalSessions.count ? Math.round((reviewedSessions.count || 0) / totalSessions.count * 100) : 0
      },
      period: {
        startDate,
        endDate
      }
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
