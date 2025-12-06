const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0' // Or configured version

export async function sendTextMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneId) {
    console.error('WhatsApp credentials missing')
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
       console.error('WhatsApp Send Error:', data)
       throw new Error(data.error?.message || 'Failed to send WhatsApp message')
    }
    return data
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    // Don't crash the app if notification fails, just log it
    return null 
  }
}
