/**
 * CRM API Route
 * Syncs data with external CRM system
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/config'

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
          console.error('CRM sync failed:', errorText)
          // Continue even if CRM sync fails (non-blocking)
        } else {
          const crmData = await crmResponse.json()
          return NextResponse.json({
            success: true,
            source: 'CRM',
            action,
            crmData,
          })
        }
      } catch (crmError: any) {
        console.error('CRM API Error:', crmError)
        // Continue even if CRM sync fails (non-blocking)
      }
    } else {
      console.warn('CRM not configured - skipping sync')
    }

    // Return success even if CRM is not configured (local operations continue)
    return NextResponse.json({
      success: true,
      source: 'CRM',
      action,
      message: 'Local operation completed',
    })
  } catch (error: any) {
    console.error('CRM API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync with CRM',
      },
      { status: 500 }
    )
  }
}
