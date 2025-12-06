import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

// Webhook verification (GET)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Debug logging (remove in production if needed)
  console.log('Webhook verification request:', {
    mode,
    token: token ? '***' : 'missing',
    expectedToken: WHATSAPP_VERIFY_TOKEN ? '***' : 'missing',
    challenge
  })

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
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
}

// Webhook handler (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

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
        if (process.env.N8N_WEBHOOK_URL) {
          await fetch(process.env.N8N_WEBHOOK_URL, {
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
async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API not configured')
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
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
