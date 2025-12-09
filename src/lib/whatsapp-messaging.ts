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
    throw new Error(error.error?.message || 'Failed to send button message')
  }

  return response.json()
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
    throw new Error(error.error?.message || 'Failed to send list message')
  }

  return response.json()
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
    throw new Error(error.error?.message || 'Failed to send text message')
  }

  return response.json()
}

/**
 * Send welcome message with action buttons
 */
export async function sendWelcomeMessage(to: string): Promise<void> {
  await sendButtonMessage(
    to,
    'مرحباً بك في مركز الهمم! 🏥\n\nنحن متخصصون في العلاج الطبيعي والتأهيل. كيف يمكنني مساعدتك اليوم؟',
    [
      { type: 'reply', reply: { id: 'book_appointment', title: '📅 حجز موعد' } },
      { type: 'reply', reply: { id: 'our_services', title: '🔍 الخدمات' } },
      { type: 'reply', reply: { id: 'contact_us', title: '📞 التواصل' } }
    ],
    'مركز الهمم'
  )
}

/**
 * Send specialist selection list
 */
export async function sendSpecialistList(to: string, specialists: any[]): Promise<void> {
  const rows: WhatsAppListRow[] = specialists.map(sp => ({
    id: sp.id,
    title: sp.name,
    description: sp.specialty
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
    throw new Error(error.error?.message || 'Failed to send image message')
  }

  return response.json()
}

/**
 * Send center location
 */
export async function sendCenterLocation(to: string): Promise<void> {
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
        type: 'location',
        location: {
          latitude: 21.5433,
          longitude: 39.1728,
          name: 'مركز الهمم',
          address: 'شارع الأمير سلطان، جدة'
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
    throw new Error(error.error?.message || 'Failed to send document message')
  }

  return response.json()
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
    throw new Error(error.error?.message || 'Failed to send template message')
  }

  return response.json()
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
    throw new Error(error.error?.message || 'Failed to send audio message')
  }

  return response.json()
}
