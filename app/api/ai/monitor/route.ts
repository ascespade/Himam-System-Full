/**
 * AI Monitoring API
 * Endpoint for patient monitoring (to be called by cron)
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { monitorAllPatients, createCriticalCaseIfNeeded } from '@/core/ai/patient-monitoring'
import { sendMonitoringAlerts } from '@/core/ai/alert-system'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/monitor
 * Run patient monitoring (cron job)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Run monitoring
    const results = await monitorAllPatients()

    // Create critical cases for high-risk patients
    for (const result of results) {
      if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
        await createCriticalCaseIfNeeded(result.patientId, result)
      }
    }

    // Send alerts
    await sendMonitoringAlerts(results)

    return NextResponse.json(successResponse({
      monitored: results.length,
      critical: results.filter(r => r.riskLevel === 'critical').length,
      high: results.filter(r => r.riskLevel === 'high').length,
      medium: results.filter(r => r.riskLevel === 'medium').length,
      results
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * GET /api/ai/monitor
 * Get monitoring status
 */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(successResponse({
      status: 'active',
      lastRun: new Date().toISOString(),
      description: 'Patient monitoring system is active. Use POST to run monitoring.'
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
