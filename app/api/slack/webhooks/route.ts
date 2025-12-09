/**
 * Slack Webhooks API
 * Handle incoming webhooks from Slack
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { slackClient } from '@/lib/slack/client'
import { sendCriticalCaseAlert } from '@/core/ai/alert-system'

export const dynamic = 'force-dynamic'

/**
 * POST /api/slack/webhooks
 * Handle Slack webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle events
    if (body.event) {
      const event = body.event

      switch (event.type) {
        case 'message':
          await handleMessageEvent(event)
          break

        case 'app_mention':
          await handleAppMentionEvent(event)
          break

        default:
          console.log('Unhandled event type:', event.type)
      }
    }

    return NextResponse.json(successResponse({ received: true }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * Handle message events
 */
async function handleMessageEvent(event: any): Promise<void> {
  // Handle direct messages or mentions
  if (event.text && event.text.includes('critical')) {
    // Notify about critical cases
    await slackClient.sendMessage({
      text: 'Critical case detected. Please check the system.',
      channel: event.channel
    })
  }
}

/**
 * Handle app mention events
 */
async function handleAppMentionEvent(event: any): Promise<void> {
  const text = event.text.toLowerCase()

  if (text.includes('status') || text.includes('health')) {
    await slackClient.sendSystemHealth({
      status: 'healthy',
      database: 'connected',
      api: 'operational'
    })
  }
}

function handleApiError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  return NextResponse.json(
    errorResponse(errorMessage),
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  )
}
