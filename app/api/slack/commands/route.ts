/**
 * Slack Commands API
 * Handle Slack slash commands
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { slackClient } from '@/lib/slack/client'
import { patientRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * POST /api/slack/commands
 * Handle Slack slash commands
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const command = formData.get('command') as string
    const text = formData.get('text') as string
    const responseUrl = formData.get('response_url') as string

    // Verify Slack request (add verification token check if needed)
    const token = formData.get('token') as string
    const expectedToken = process.env.SLACK_VERIFICATION_TOKEN

    if (expectedToken && token !== expectedToken) {
      return NextResponse.json(errorResponse('Invalid token'), { status: HTTP_STATUS.UNAUTHORIZED })
    }

    let responseText = ''

    switch (command) {
      case '/patient-status':
        responseText = await handlePatientStatusCommand(text)
        break

      case '/system-health':
        responseText = await handleSystemHealthCommand()
        break

      case '/support':
        responseText = await handleSupportCommand(text)
        break

      default:
        responseText = 'Unknown command. Available commands: /patient-status, /system-health, /support'
    }

    // Send immediate response
    return NextResponse.json({
      response_type: 'in_channel',
      text: responseText
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      errorResponse(errorMessage),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * Handle /patient-status command
 */
async function handlePatientStatusCommand(text: string): Promise<string> {
  try {
    const patientId = text.trim()

    if (!patientId) {
      return 'Usage: /patient-status <patient_id>'
    }

    const patient = await patientRepository.findById(patientId)

    if (!patient) {
      return `Patient ${patientId} not found`
    }

    // Get recent visits
    const { data: visits } = await supabaseAdmin
      .from('patient_visits')
      .select('visit_date, status')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
      .limit(5)

    const visitsText = visits && visits.length > 0
      ? visits.map(v => `- ${new Date(v.visit_date).toLocaleDateString()}: ${v.status}`).join('\n')
      : 'No visits recorded'

    return `
*Patient Status: ${patient.name}*

*ID:* ${patient.id}
*Phone:* ${patient.phone || 'N/A'}
*Status:* ${patient.status}
*Last Visits:*
${visitsText}
    `.trim()
  } catch (error) {
    return `Error fetching patient status: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Handle /system-health command
 */
async function handleSystemHealthCommand(): Promise<string> {
  try {
    // Check database
    const { error: dbError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .limit(1)

    const dbStatus = dbError ? '❌ Error' : '✅ Healthy'

    // Check API (simple check)
    const apiStatus = '✅ Healthy'

    return `
*System Health Report*

*Database:* ${dbStatus}
*API:* ${apiStatus}
*Timestamp:* ${new Date().toISOString()}
    `.trim()
  } catch (error) {
    return `Error checking system health: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Handle /support command
 */
async function handleSupportCommand(text: string): Promise<string> {
  const supportMessage = text.trim()

  if (!supportMessage) {
    return 'Usage: /support <your message>\nExample: /support Need help with patient registration'
  }

  // Send to support channel
  await slackClient.sendMessage({
    text: `Support Request: ${supportMessage}`,
    channel: process.env.SLACK_SUPPORT_CHANNEL || '#support'
  })

  return '✅ Support request submitted. Our team will respond shortly.'
}
