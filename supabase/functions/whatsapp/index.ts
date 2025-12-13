/**
 * Supabase Edge Function for WhatsApp Webhook
 * Handles WhatsApp messages with AI responses
 * 
 * Deploy: supabase functions deploy whatsapp
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Webhook verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Get verify token from settings
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'WHATSAPP_VERIFY_TOKEN').single()
    const verifyToken = settings?.value || Deno.env.get('WHATSAPP_VERIFY_TOKEN') || ''

    if (mode === 'subscribe' && token === verifyToken) {
      return new Response(challenge || '', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      })
    }

    return new Response('Forbidden', {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    })
  }

  // Handle incoming messages (POST)
  const body = await req.json()

  if (body.object === 'whatsapp_business_account') {
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (value?.messages) {
      const message = value.messages[0]
      const from = message.from
      const text = message.text?.body || ''

      if (!text) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get settings
      const { data: allSettings } = await supabase.from('settings').select('key, value')
      const settings: Record<string, string> = {}
      allSettings?.forEach((s) => (settings[s.key] = s.value))

      // Get or create conversation
      let conversation = null
      const { data: existingConversation } = await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('phone_number', from)
        .single()

      if (existingConversation) {
        conversation = existingConversation
      } else {
        const { data: newConversation } = await supabase
          .from('whatsapp_conversations')
          .insert({
            phone_number: from,
            status: 'active',
          })
          .select()
          .single()
        conversation = newConversation
      }

      // Get conversation history from messages
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('content, direction')
        .eq('conversation_id', conversation?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const history = messages?.reverse().map((m: Record<string, unknown>) => ({
        user_message: m.direction === 'inbound' ? m.content : '',
        ai_response: m.direction === 'outbound' ? m.content : '',
      })) || []

      // Generate AI response using Gemini (primary) or OpenAI (fallback)
      const aiPrompt = `أنت مساعد ذكي لمركز الهمم الطبي في جدة، المملكة العربية السعودية.
      
مهمتك:
- الرد على استفسارات المرضى بشكل مهني ومتعاطف
- مساعدة المرضى في حجز المواعيد
- تقديم معلومات عن الخدمات الطبية المتاحة
- الرد بالعربية والإنجليزية حسب الحاجة

الخدمات المتاحة:
- جلسات تخاطب
- تعديل السلوك
- العلاج الوظيفي
- التكامل الحسي
- التدخل المبكر

${history && history.length > 0 ? `تاريخ المحادثة:\n${history.map((h: Record<string, unknown>) => `المريض: ${h.user_message}\nالمساعد: ${h.ai_response}`).join('\n\n')}\n\n` : ''}الرسالة الجديدة من المريض: ${text}

رد بشكل مهذب ومهني ومفيد.`

      let aiResponse = 'شكراً لتواصلك مع مركز الهمم. سنرد عليك قريباً.'

      // Try Gemini first (primary)
      if (settings.GEMINI_KEY) {
        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${settings.GEMINI_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
              }),
            }
          )

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json()
            aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || aiResponse
          }
        } catch (error) {
          console.error('Gemini error:', error)
          // Fall through to OpenAI fallback
        }
      }

      // Fallback to OpenAI if Gemini fails or not configured
      if (aiResponse === 'شكراً لتواصلك مع مركز الهمم. سنرد عليك قريباً.' && settings.OPENAI_KEY) {
        try {
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${settings.OPENAI_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a medical assistant for مركز الهمم (Alhimam Center) in Jeddah, Saudi Arabia. Respond in Arabic and English as needed. Be professional, helpful, and empathetic.',
                },
                { role: 'user', content: text },
              ],
              temperature: 0.7,
            }),
          })

          if (openaiResponse.ok) {
            const openaiData = await openaiResponse.json()
            aiResponse = openaiData.choices?.[0]?.message?.content || aiResponse
          }
        } catch (error) {
          console.error('OpenAI error:', error)
        }
      }

      // Ensure conversation exists
      if (!conversation) {
        const { data: newConv } = await supabase
          .from('whatsapp_conversations')
          .insert({
            phone_number: from,
            status: 'active',
          })
          .select()
          .single()
        conversation = newConv
      }

      // Save inbound message
      await supabase.from('whatsapp_messages').insert({
        message_id: message.id || `msg_${Date.now()}`,
        from_phone: from,
        to_phone: settings.WHATSAPP_PHONE_NUMBER_ID || '',
        message_type: 'text',
        content: text,
        direction: 'inbound',
        status: 'delivered',
        conversation_id: conversation.id,
      })

      // Save outbound message (AI response)
      await supabase.from('whatsapp_messages').insert({
        message_id: `out_${Date.now()}`,
        from_phone: settings.WHATSAPP_PHONE_NUMBER_ID || '',
        to_phone: from,
        message_type: 'text',
        content: aiResponse,
        direction: 'outbound',
        status: 'sent',
        conversation_id: conversation.id,
      })

      // Send WhatsApp reply
      if (settings.WHATSAPP_TOKEN && settings.WHATSAPP_PHONE_NUMBER_ID) {
        await fetch(
          `https://graph.facebook.com/v20.0/${settings.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${settings.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: from,
              type: 'text',
              text: { body: aiResponse },
            }),
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, reply: aiResponse }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})



