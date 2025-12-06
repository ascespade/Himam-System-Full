/**
 * WhatsApp Webhook API Route - ENHANCED VERSION
 * Handles WhatsApp Cloud API webhooks with rich messaging and automated booking
 * Integrated with AI service for intelligent responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/config'
import { generateWhatsAppResponse } from '@/lib/ai'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, parseRequestBody } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { logError } from '@/shared/utils/logger'
import type { WhatsAppWebhookPayload } from '@/shared/types'
import {
  sendTextMessage,
  sendWelcomeMessage,
  sendSpecialistList,
  sendAppointmentConfirmation,
  sendButtonMessage,
  sendCenterLocation,
  sendDocumentMessage,
  sendTemplateMessage
} from '@/lib/whatsapp-messaging'
import {
  parseBookingFromAI,
  hasBookingIntent,
  formatAppointmentDate,
  formatAppointmentTime
} from '@/lib/booking-parser'

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
        const messageId = message.id

        /*
        if (from === '966581421483') {
           await sendTextMessage(from, 'عذراً، حدث خطأ في النظام. رمز الخطأ: USER_BLOCKED')
           return NextResponse.json(successResponse({ messageId, action: 'blocked' }))
        }
        */

        // Handle different message types
        let text = ''
        let interactiveResponse = null

        if (message.type === 'text') {
          text = message.text?.body || ''
        } else if (message.type === 'interactive' && message.interactive) {
          // Handle button/list responses
          interactiveResponse = message.interactive
          if (interactiveResponse.type === 'button_reply' && interactiveResponse.button_reply) {
            text = interactiveResponse.button_reply.title || ''
          } else if (interactiveResponse.type === 'list_reply' && interactiveResponse.list_reply) {
            text = interactiveResponse.list_reply.title || ''
          }
        } else if (message.type === 'image' || message.type === 'document') {
          // Handle media messages
          // Since AI currently processes text, we acknowledge receipt and notify user
          const mediaType = message.type === 'image' ? 'الصورة' : 'الملف'
          await sendTextMessage(from || '', `شكراً لك! تم استلام ${mediaType}. سيقوم أحد موظفينا بمراجعته قريباً.`)
          
          // Log media message
          await supabaseAdmin.from('conversation_history').insert({
            user_phone: from,
            user_message: `[${message.type.toUpperCase()}] ID: ${message[message.type]?.id || 'unknown'}`,
            ai_response: `تم استلام ${mediaType} بنجاح.`,
            session_id: messageId || undefined,
          })
          
          return NextResponse.json(successResponse({ messageId, action: 'media_received' }))
        }

        if (!text || !from) {
          return NextResponse.json(successResponse(null, 'No text content or sender'))
        }

        // Check if this is a first-time user (send welcome)
        const { data: existingConversations } = await supabaseAdmin
          .from('conversation_history')
          .select('id')
          .eq('user_phone', from)
          .limit(1)

        const isFirstMessage = !existingConversations || existingConversations.length === 0

        if (isFirstMessage) {
          await sendWelcomeMessage(from)
          return NextResponse.json(successResponse({ messageId, firstTimeUser: true }))
        }

        // Handle quick action buttons
        if (interactiveResponse?.button_reply) {
          const buttonId = interactiveResponse.button_reply.id

          if (buttonId === 'book_appointment') {
            // Fetch specialists from database
            const { data: specialists } = await supabaseAdmin
              .from('specialists')
              .select('*')
              .limit(10)

            if (specialists && specialists.length > 0) {
              await sendSpecialistList(from, specialists)
              return NextResponse.json(successResponse({ messageId, action: 'specialist_list_sent' }))
            }
          } else if (buttonId === 'our_services') {
            const servicesText = `🏥 خدماتنا المتاحة:\n\n` +
              `1. 🗣️ علاج النطق - جلسات تخاطب متخصصة\n` +
              `2. 🧠 تعديل السلوك - برامج سلوكية مخصصة\n` +
              `3. 🤲 العلاج الوظيفي - تطوير المهارات الحياتية\n` +
              `4. 🎯 التكامل الحسي\n` +
              `5. 👶 التدخل المبكر\n\n` +
              `للحجز، اضغط على "حجز موعد" أو أرسل رسالة بالخدمة المطلوبة.`

            await sendTextMessage(from, servicesText)
            return NextResponse.json(successResponse({ messageId, action: 'services_sent' }))
          } else if (buttonId === 'contact_us') {
            const contactText = `📞 معلومات التواصل:\n\n` +
              `📍 الموقع: جدة، المملكة العربية السعودية\n` +
              `📞 الهاتف: +966 12 345 6789\n` +
              `📧 البريد: info@al-himam.com\n` +
              `⏰ أوقات العمل: الأحد-الخميس، 9 صباحاً - 5 مساءً`

            await sendTextMessage(from, contactText)
            
            // Send location map
            await sendCenterLocation(from)
            
            return NextResponse.json(successResponse({ messageId, action: 'contact_sent' }))
          }
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
        const aiResponse = await generateWhatsAppResponse(from, text, conversationHistory)

        // Save conversation to database
        await supabaseAdmin.from('conversation_history').insert({
          user_phone: from,
          user_message: text,
          ai_response: aiResponse.text,
          session_id: messageId || undefined,
        })

        // Check if AI extracted booking details
        const bookingDetails = parseBookingFromAI(aiResponse.text)

        if (bookingDetails && bookingDetails.isComplete) {
          // Create appointment in database
          try {
            const { data: appointment, error: aptError } = await supabaseAdmin
              .from('appointments')
              .insert({
                patient_name: bookingDetails.patientName,
                phone: bookingDetails.phone || from,
                specialist: bookingDetails.specialist,
                date: new Date(`${bookingDetails.date}T${bookingDetails.time}`).toISOString(),
                status: 'pending',
                notes: `Service: ${bookingDetails.service || 'Not specified'}`
              })
              .select()
              .single()

            if (!aptError && appointment) {
              // Send confirmation with buttons
              await sendAppointmentConfirmation(from, {
                specialist: bookingDetails.specialist || 'الأخصائي',
                date: formatAppointmentDate(bookingDetails.date || ''),
                time: formatAppointmentTime(bookingDetails.time || '')
              })

              return NextResponse.json(
                successResponse({
                  messageId,
                  aiResponse: aiResponse.text,
                  model: aiResponse.model,
                  bookingCreated: true,
                  appointmentId: appointment.id
                })
              )
            }
          } catch (error) {
            console.error('Error creating appointment:', error)
            // Continue with regular response if booking fails
          }
        }

        // Send AI response (clean version without [BOOKING_READY] marker)
        const cleanResponse = aiResponse.text.replace(/\[BOOKING_READY\][\s\S]*?}/g, '').trim()
        await sendTextMessage(from, cleanResponse)

        // If message has booking intent but details incomplete, offer help
        if (hasBookingIntent(text) && !bookingDetails?.isComplete) {
          setTimeout(async () => {
            await sendButtonMessage(
              from,
              'هل تحتاج مساعدة في حجز الموعد؟',
              [
                { type: 'reply', reply: { id: 'book_appointment', title: 'نعم، ساعدني' } },
                { type: 'reply', reply: { id: 'continue_chat', title: 'لا، شكراً' } }
              ]
            )
          }, 2000) // Send after 2 seconds
        }

        return NextResponse.json(
          successResponse({
            messageId,
            aiResponse: cleanResponse,
            model: aiResponse.model,
            bookingIntent: hasBookingIntent(text),
            bookingComplete: bookingDetails?.isComplete || false
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
