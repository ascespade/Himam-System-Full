import { getSettings } from './config'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0' // Or configured version

export async function sendTextMessage(to: string, text: string) {
  const settings = await getSettings()
  const token = settings.WHATSAPP_TOKEN
  const phoneId = settings.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneId) {
    const { logError } = await import('@/shared/utils/logger')
    logError('WhatsApp credentials missing - check database settings')
    return null
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
       const { logError } = await import('@/shared/utils/logger')
       logError('WhatsApp Send Error', data)
       throw new Error(data.error?.message || 'Failed to send WhatsApp message')
    }
    return data
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error sending WhatsApp message', error)
    // Don't crash the app if notification fails, just log it
    return null 
  }
}
