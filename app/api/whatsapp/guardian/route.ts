/**
 * WhatsApp Guardian API
 * Handle WhatsApp messages from guardians
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { guardianRepository } from '@/infrastructure/supabase/repositories'
import { sendTextMessage } from '@/lib/whatsapp-messaging'
import { generateWhatsAppResponse } from '@/lib/ai'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/guardian
 * Handle WhatsApp messages from guardians
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { from, message, messageId } = body

    if (!from || !message) {
      return NextResponse.json(
        errorResponse('Phone number and message are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Find guardian by phone
    const { data: guardian } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, role')
      .eq('phone', from)
      .eq('role', 'guardian')
      .single()

    if (!guardian) {
      await sendTextMessage(from, 'عذراً، أنت غير مسجل كولي أمر في النظام. يرجى التواصل مع الإدارة.')
      return NextResponse.json(successResponse({ action: 'not_guardian' }))
    }

    // Get guardian's patients
    const relationships = await guardianRepository.getGuardianPatients(guardian.id)
    
    if (relationships.length === 0) {
      await sendTextMessage(from, 'لا توجد مرضى مرتبطين بحسابك.')
      return NextResponse.json(successResponse({ action: 'no_patients' }))
    }

    // Get or create conversation
    let conversation = null
    const { data: existingConversation } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', from)
      .single()

    if (existingConversation) {
      conversation = existingConversation
    } else {
      const { data: newConversation } = await supabaseAdmin
        .from('whatsapp_conversations')
        .insert({
          phone_number: from,
          status: 'active',
        })
        .select()
        .single()
      conversation = newConversation
    }

    // Get conversation history
    const { data: messages } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('content, direction')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(10)

        const formattedHistory = messages
          ? messages.reverse().map((m: any) => {
              if (m.direction === 'inbound') {
                return { role: 'user' as const, content: m.content }
              } else {
                return { role: 'assistant' as const, content: m.content }
              }
            })
          : []

    // Use AI to understand the message intent
    const aiResponse = await generateWhatsAppResponse(
      from,
      message,
      formattedHistory,
      undefined // patientName
    )

    // Send AI response
    const responseResult = await sendTextMessage(from, aiResponse.text)

    // Save inbound message
    await supabaseAdmin.from('whatsapp_messages').insert({
      message_id: messageId || `guardian_${Date.now()}`,
      from_phone: from,
      to_phone: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      message_type: 'text',
      content: message,
      direction: 'inbound',
      status: 'delivered',
      conversation_id: conversation.id,
    })

    // Save outbound message
    if (responseResult?.messageId) {
      await supabaseAdmin.from('whatsapp_messages').insert({
        message_id: responseResult.messageId,
        from_phone: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        to_phone: from,
        message_type: 'text',
        content: aiResponse.text,
        direction: 'outbound',
        status: 'sent',
        conversation_id: conversation.id,
      })
    }

    return NextResponse.json(successResponse({
      messageId,
      action: 'responded',
      guardianId: guardian.id
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
