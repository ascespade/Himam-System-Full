import { NextRequest, NextResponse } from 'next/server'
import { whatsappSettingsRepository } from '@/src/infrastructure/supabase/repositories/whatsapp-settings.repository'

// Get settings from database (with fallback to environment variables)
async function getWhatsAppSettings() {
  try {
    // Try database first
    const dbSettings = await whatsappSettingsRepository.getActiveSettings()
    
    if (dbSettings && dbSettings.verify_token) {
      return {
        verifyToken: dbSettings.verify_token,
        accessToken: dbSettings.access_token,
        phoneNumberId: dbSettings.phone_number_id,
        n8nWebhookUrl: dbSettings.n8n_webhook_url,
      }
    }
  } catch (error) {
    console.error('Error fetching WhatsApp settings from database:', error)
  }

  // Fallback to environment variables (for backward compatibility)
  return {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || null,
  }
}

// Webhook verification (GET)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const settings = await getWhatsAppSettings()

    // Debug logging
    console.log('Webhook verification request:', {
      mode,
      token: token ? '***' : 'missing',
      expectedToken: settings.verifyToken ? '***' : 'missing',
      challenge,
      tokenMatch: token === settings.verifyToken,
      tokenLength: token?.length,
      expectedLength: settings.verifyToken?.length
    })

    // Check if mode and token match
    if (mode === 'subscribe' && token && settings.verifyToken && token === settings.verifyToken) {
      if (!challenge) {
        return NextResponse.json({ error: 'Challenge missing' }, { status: 400 })
      }
      return new NextResponse(challenge, { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

    return NextResponse.json({ 
      error: 'Forbidden',
      message: 'Invalid verify token or mode'
    }, { status: 403 })
  } catch (error: any) {
    console.error('Webhook verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Webhook handler (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const settings = await getWhatsAppSettings()

    // Handle WhatsApp webhook events
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (value?.messages) {
        const message = value.messages[0]
        const from = message.from
        const text = message.text?.body || ''

        // Store message in database or process it
        // This could trigger n8n workflow for automated responses
        const n8nUrl = settings.n8nWebhookUrl || process.env.N8N_WEBHOOK_URL
        if (n8nUrl) {
          await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'whatsapp_message',
              from,
              text,
              timestamp: message.timestamp,
            }),
          }).catch(console.error)
        }

        // Optional: Auto-reply using AI
        if (text && process.env.GEMINI_API_KEY) {
          // Trigger AI response workflow
          console.log('Processing WhatsApp message with AI:', text)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('WhatsApp API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process WhatsApp webhook' },
      { status: 500 }
    )
  }
}

// Helper function to send WhatsApp message (internal use only)
export async function sendWhatsAppMessage(to: string, message: string) {
  const settings = await getWhatsAppSettings()
  
  if (!settings.accessToken || !settings.phoneNumberId) {
    throw new Error('WhatsApp API not configured')
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${settings.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.accessToken}`,
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
