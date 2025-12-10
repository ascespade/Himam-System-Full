/**
 * WhatsApp Rich Messaging Utilities
 * Provides functions to send interactive messages (buttons, lists, templates)
 */

import { getSettings } from './config'

export interface WhatsAppButton {
  type: 'reply'
  reply: {
    id: string
    title: string
  }
}

export interface WhatsAppListRow {
  id: string
  title: string
  description?: string
}

export interface WhatsAppListSection {
  title: string
  rows: WhatsAppListRow[]
}

/**
 * Send a text message with quick reply buttons
 */
export async function sendButtonMessage(
  to: string,
  bodyText: string,
  buttons: WhatsAppButton[],
  headerText?: string
): Promise<{ success: boolean; messageId?: string }> {
  const settings = await getSettings()

  if (!settings.WHATSAPP_TOKEN || !settings.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API not configured')
  }

  const message: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: { buttons }
    }
  }

  if (headerText) {
    message.interactive.header = { type: 'text', text: headerText }
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${settings.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API Error:', error)
    throw new Error(error.error?.message || 'Failed to send button message')
  }

  const result = await response.json()
  return {
    success: true,
    messageId: result.messages?.[0]?.id || null
  }
}

/**
 * Send a list message for selection
 */
export async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: WhatsAppListSection[],
  headerText?: string
): Promise<{ success: boolean; messageId?: string }> {
  const settings = await getSettings()

  if (!settings.WHATSAPP_TOKEN || !settings.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API not configured')
  }

  const message: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections
      }
    }
  }

  if (headerText) {
    message.interactive.header = { type: 'text', text: headerText }
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${settings.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API Error:', error)
    throw new Error(error.error?.message || 'Failed to send list message')
  }

  const result = await response.json()
  return {
    success: true,
    messageId: result.messages?.[0]?.id || null
  }
}

/**
 * Send a simple text message
 */
export async function sendTextMessage(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string }> {
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
        text: { body: text },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API Error:', error)
    throw new Error(error.error?.message || 'Failed to send text message')
  }

  const result = await response.json()
  // Meta API returns: { messages: [{ id: "wamid.xxx" }] }
  return {
    success: true,
    messageId: result.messages?.[0]?.id || null
  }
}

/**
 * Send welcome message with action buttons
 */
export async function sendWelcomeMessage(to: string): Promise<void> {
  // Fetch center info from database
  const { supabaseAdmin } = await import('./supabase')
  const { data: centerInfo } = await supabaseAdmin
    .from('center_info')
    .select('name_ar, description_ar')
    .single()

  const centerName = centerInfo?.name_ar || 'مركز الهمم'
  const description = centerInfo?.description_ar || 'نحن متخصصون في العلاج الطبيعي والتأهيل'

  await sendButtonMessage(
    to,
    `مرحباً بك في ${centerName}! 🏥\n\n${description}. كيف يمكنني مساعدتك اليوم؟`,
    [
      { type: 'reply', reply: { id: 'book_appointment', title: '📅 حجز موعد' } },
      { type: 'reply', reply: { id: 'our_services', title: '🔍 الخدمات' } },
      { type: 'reply', reply: { id: 'contact_us', title: '📞 التواصل' } }
    ],
    centerName
  )
}

/**
 * Send specialist selection list
 */
export async function sendSpecialistList(to: string, specialists: any[]): Promise<void> {
  const rows: WhatsAppListRow[] = specialists.map(sp => ({
    id: sp.id,
    title: sp.name,
    description: sp.specialty || sp.specialization || 'أخصائي'
  }))

  await sendListMessage(
    to,
    'اختر الأخصائي المناسب لحالتك:',
    'عرض الأخصائيين',
    [{ title: 'الأخصائيون المتاحون', rows }],
    'حجز موعد'
  )
}

/**
 * Send appointment confirmation
 */
export async function sendAppointmentConfirmation(
  to: string,
  appointmentDetails: {
    specialist: string
    date: string
    time: string
  }
): Promise<void> {
  await sendButtonMessage(
    to,
    `تم حجز موعدك بنجاح! ✅\n\n` +
    `الأخصائي: ${appointmentDetails.specialist}\n` +
    `التاريخ: ${appointmentDetails.date}\n` +
    `الوقت: ${appointmentDetails.time}\n\n` +
    `سنرسل لك تذكيراً قبل الموعد بـ 24 ساعة.`,
    [
      { type: 'reply', reply: { id: 'confirm_apt', title: '✓ تأكيد' } },
      { type: 'reply', reply: { id: 'reschedule_apt', title: '↻ تغيير الموعد' } }
    ],
    'تأكيد الموعد'
  )
}

/**
 * Send an image message
 */
export async function sendImageMessage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string }> {
  const settings = await getSettings()

  if (!settings.WHATSAPP_TOKEN || !settings.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API not configured')
  }

  const message: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: imageUrl
    }
  }

  if (caption) {
    message.image.caption = caption
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${settings.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API Error:', error)
    throw new Error(error.error?.message || 'Failed to send image message')
  }

  const result = await response.json()
  return {
    success: true,
    messageId: result.messages?.[0]?.id || null
  }
}

/**
 * Send center location
 */
export async function sendCenterLocation(to: string): Promise<void> {
  const settings = await getSettings()

  if (!settings.WHATSAPP_TOKEN || !settings.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API not configured')
  }

  // Fetch center location from database
  const { supabaseAdmin } = await import('./supabase')
  const { data: centerInfo } = await supabaseAdmin
    .from('center_info')
    .select('address_ar, city_ar')
    .single()

  // Default coordinates for Jeddah (can be stored in center_info if needed)
  const latitude = 21.5433
  const longitude = 39.1728
  const address = centerInfo?.address_ar || 'جدة، المملكة العربية السعودية'
  const name = 'مركز الهمم'

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
        type: 'location',
        location: {
          latitude,
          longitude,
          name,
          address
        }
      }),
    }
  )

  if (!response.ok) {
    console.error('Failed to send location')
  }
}

/**
 * Send a document message (PDF, etc.)
 */
export async function sendDocumentMessage(
  to: string,
  documentUrl: string,
  filename?: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string }> {
  const settings = await getSettings()

  if (!settings.WHATSAPP_TOKEN || !settings.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API not configured')
  }

  const message: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: {
      link: documentUrl
    }
  }

  if (filename) {
    message.document.filename = filename
  }

  if (caption) {
    message.document.caption = caption
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${settings.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API Error:', error)
    throw new Error(error.error?.message || 'Failed to send document message')
  }

  const result = await response.json()
  return {
    success: true,
    messageId: result.messages?.[0]?.id || null
  }
}

/**
 * Send a template message (HSM)
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'ar',
  components: any[] = []
): Promise<{ success: boolean; messageId?: string }> {
  const settings = await getSettings()

  if (!settings.WHATSAPP_TOKEN || !settings.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API not configured')
  }

  const message: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode
      }
    }
  }

  if (components && components.length > 0) {
    message.template.components = components
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${settings.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API Error:', error)
    throw new Error(error.error?.message || 'Failed to send template message')
  }

  const result = await response.json()
  return {
    success: true,
    messageId: result.messages?.[0]?.id || null
  }
}

/**
 * Send an audio message
 */
export async function sendAudioMessage(
  to: string,
  audioId: string
): Promise<{ success: boolean; messageId?: string }> {
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
        type: 'audio',
        audio: {
          id: audioId
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API Error:', error)
    throw new Error(error.error?.message || 'Failed to send audio message')
  }

  const result = await response.json()
  return {
    success: true,
    messageId: result.messages?.[0]?.id || null
  }
}
