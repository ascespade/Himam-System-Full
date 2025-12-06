/**
 * WhatsApp Webhook API Route
 * Handles WhatsApp Cloud API webhooks and message processing
 * Integrated with AI service for automated responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/config'
import { generateWhatsAppResponse } from '@/lib/ai'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, parseRequestBody } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { logError } from '@/shared/utils/logger'
import type { WhatsAppWebhookPayload } from '@/shared/types'

/**
 * Send WhatsApp message via Meta API
 */
async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string }> {
  const settings = await getSettings()

  if (!settings.WHATSAPP_TOKEN || !settings.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API not configured')
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${settings.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to send WhatsApp message')
  }

  return response.json()
}

/**
 * Webhook verification (GET)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const settings = await getSettings()
    const verifyToken = settings.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || ''

    if (mode === 'subscribe' && token && token === verifyToken) {
      if (!challenge) {
        return new NextResponse('Challenge missing', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        })
      }

      return new NextResponse(challenge, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    return new NextResponse('Forbidden', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    logError('Webhook verification error', error)
    return new NextResponse('Internal server error', {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

/**
 * Webhook handler (POST) - Process incoming WhatsApp messages
 */
export async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody<WhatsAppWebhookPayload>(req)

    // Handle WhatsApp webhook events
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (value?.messages && value.messages.length > 0) {
        const message = value.messages[0]
        const from = message.from
        const text = message.text?.body || ''
        const messageId = message.id

        if (!text || !from) {
          return NextResponse.json(successResponse(null, 'No text content or sender'))
        }

        // Get conversation history for context
        const { data: history } = await supabaseAdmin
          .from('conversation_history')
          .select('user_message, ai_response')
          .eq('user_phone', from)
          .order('created_at', { ascending: false })
          .limit(10)

        const conversationHistory = history
          ?.reverse()
          .flatMap((h) => [
            { role: 'user' as const, content: h.user_message },
            { role: 'assistant' as const, content: h.ai_response },
          ]) || []

        // Generate AI response
        const aiResponse = await generateWhatsAppResponse(from || '', text, conversationHistory)

        // Save conversation to database
        await supabaseAdmin.from('conversation_history').insert({
          user_phone: from,
          user_message: text,
          ai_response: aiResponse.text,
          session_id: messageId || undefined,
        })

        // Send WhatsApp reply
        await sendWhatsAppMessage(from, aiResponse.text)

        // Check if message contains booking keywords
        const bookingKeywords = ['حجز', 'موعد', 'appointment', 'book', 'schedule']
        const isBookingRequest = bookingKeywords.some((keyword) =>
          text.toLowerCase().includes(keyword.toLowerCase())
        )

        if (isBookingRequest) {
          // Extract appointment details from message (simplified - can be enhanced with AI)
          // TODO: Use AI to extract appointment details and create calendar event via /api/calendar
          // Note: Booking requests are logged in conversation_history for manual processing
        }

        return NextResponse.json(
          successResponse({
            messageId,
            aiResponse: aiResponse.text,
            model: aiResponse.model,
          })
        )
      }
    }

    return NextResponse.json(successResponse(null))
  } catch (error) {
    logError('WhatsApp API Error', error)
    return NextResponse.json(
      errorResponse(error),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
