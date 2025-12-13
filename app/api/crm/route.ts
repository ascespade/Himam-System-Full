/**
 * CRM API Route
 * Syncs data with external CRM system
 * Non-blocking: continues even if CRM sync fails
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/config'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { logError, logWarn, logInfo } from '@/shared/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, patientId, sessionId, data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const settings = await getSettings()

    // Sync with external CRM if configured
    if (settings.CRM_URL && settings.CRM_TOKEN) {
      try {
        const crmResponse = await fetch(`${settings.CRM_URL}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.CRM_TOKEN}`,
          },
          body: JSON.stringify({
            action,
            patientId,
            sessionId,
            data,
            timestamp: new Date().toISOString(),
          }),
        })

        if (!crmResponse.ok) {
          const errorText = await crmResponse.text()
          logError('CRM sync failed', new Error(errorText), { action, patientId })
          // Continue even if CRM sync fails (non-blocking)
        } else {
          const crmData = await crmResponse.json()
          logInfo('CRM sync successful', { action, patientId })
          return NextResponse.json(
            successResponse({
              source: 'CRM',
              action,
              crmData,
            })
          )
        }
      } catch (crmError: unknown) {
        logError('CRM API Error', crmError, { action, patientId })
        // Continue even if CRM sync fails (non-blocking)
      }
    } else {
      logWarn('CRM not configured - skipping sync', { action })
    }

    // Return success even if CRM is not configured (local operations continue)
    return NextResponse.json(
      successResponse({
        source: 'CRM',
        action,
        message: 'Local operation completed',
      })
    )
  } catch (error: unknown) {
    logError('CRM API Error', error)
    return NextResponse.json(
      errorResponse(error),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
