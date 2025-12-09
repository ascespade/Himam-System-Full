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

    // Use AI to understand the message intent
    const aiResponse = await generateWhatsAppResponse(
      from,
      message,
      undefined, // conversationHistory
      undefined // patientName
    )

    // Send AI response
    await sendTextMessage(from, aiResponse.text)

    // Log interaction
    await supabaseAdmin.from('conversation_history').insert({
      user_phone: from,
      user_message: message,
      ai_response: aiResponse.text,
      session_id: `guardian-${guardian.id}`
    })

    return NextResponse.json(successResponse({
      messageId,
      action: 'responded',
      guardianId: guardian.id
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
