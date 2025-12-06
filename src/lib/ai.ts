/**
 * AI Service - Gemini 2.0 Flash (primary) + OpenAI (fallback)
 * Handles all AI interactions for the system
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { getSettings } from './config'

export interface AIResponse {
  text: string
  model: 'gemini' | 'openai'
  error?: string
}

import { sendTextMessage } from './whatsapp-messaging'

/**
 * Ask AI a question with automatic fallback
 * @param prompt - The question/prompt to send to AI
 * @param context - Optional context for the conversation
 * @returns AI response text
 */
export async function askAI(prompt: string, context?: string): Promise<AIResponse> {
  const settings = await getSettings()
  
  // FAILSAFE: Check Environment Variables if DB is empty
  const GEMINI_KEY = settings.GEMINI_KEY || process.env.GEMINI_KEY
  const OPENAI_KEY = settings.OPENAI_KEY || process.env.OPENAI_KEY

  const ADMIN_PHONE = '966581421483'

  // Validation Check
  if (!GEMINI_KEY && !OPENAI_KEY) {
     const msg = 'CRITICAL: No AI API Keys found in Database Settings table.'
     console.error(msg)
     await sendTextMessage(ADMIN_PHONE, `⚠️ System Alert:\n${msg}`) // Alert Admin
     return {
        text: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.',
        model: 'openai',
        error: 'No AI service configured',
      }
  }

  // Try Gemini first (primary)
  if (GEMINI_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const fullPrompt = context
        ? `Context: ${context}\n\nUser message: ${prompt}`
        : prompt

      const result = await model.generateContent(fullPrompt)
      const text = result.response.text()

      return {
        text,
        model: 'gemini',
      }
    } catch (error: any) {
      console.error('Gemini API error:', error)
      await sendTextMessage(ADMIN_PHONE, `⚠️ Gemini Error:\n${error.message || error}`) // Alert Admin
      // Fall through to OpenAI fallback
    }
  }

  // Fallback to OpenAI
  if (OPENAI_KEY) {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_KEY })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system' as const,
            content:
              'You are a medical assistant for مركز الهمم (Alhimam Center) in Jeddah, Saudi Arabia. Respond in Arabic and English as needed. Be professional, helpful, and empathetic.',
          },
          ...(context
            ? [
                {
                  role: 'system' as const,
                  content: `Context: ${context}`,
                },
              ]
            : []),
          {
            role: 'user' as const,
            content: prompt,
          },
        ],
        temperature: 0.7,
      })

      const text = completion.choices[0]?.message?.content || 'AI response unavailable'

      return {
        text,
        model: 'openai',
      }
    } catch (error: any) {
      console.error('OpenAI API error:', error)
      await sendTextMessage(ADMIN_PHONE, `⚠️ OpenAI Error (Fallback Failed):\n${error.message}`) // Alert Admin
      return {
        text: 'عذراً، لا يمكنني الرد في الوقت الحالي. يرجى المحاولة لاحقاً.',
        model: 'openai',
        error: error.message || 'AI service unavailable',
      }
    }
  }

  // No AI service configured (or Gemini failed and no OpenAI)
   return {
    text: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.',
    model: 'openai',
    error: 'No AI service configured',
  }
}

/**
 * Generate AI response for WhatsApp messages with booking extraction
 * @param userPhone - User's phone number
 * @param userMessage - User's WhatsApp message
 * @param conversationHistory - Previous messages in the conversation
 * @returns AI response with potential booking data
 */
export async function generateWhatsAppResponse(
  userPhone: string,
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AIResponse> {
  const systemPrompt = `أنت مساعد ذكي لمركز الهمم الطبي في جدة، المملكة العربية السعودية.

مهمتك الأساسية:
- الرد على استفسارات المرضى بشكل مهني ومتعاطف
- مساعدة المرضى في حجز المواعيد
- تقديم معلومات عن الخدمات الطبية المتاحة
- الرد بالعربية والإنجليزية حسب لغة المريض

معلومات المركز:
📍 الموقع: جدة، المملكة العربية السعودية
📞 الهاتف: +966 12 345 6789
📧 البريد: info@al-himam.com
⏰ أوقات العمل: الأحد-الخميس، 9 صباحاً - 5 مساءً

الخدمات المتاحة:
1. 🗣️ علاج النطق (Speech Therapy) - جلسات تخاطب متخصصة
2. 🧠 تعديل السلوك (Behavior Modification) - برامج سلوكية مخصصة
3. 🤲 العلاج الوظيفي (Occupational Therapy) - تطوير المهارات الحياتية
4. 🎯 التكامل الحسي (Sensory Integration)
5. 👶 التدخل المبكر (Early Intervention)

الأخصائيون المتاحون:
- د. سارة الزهراني - علاج النطق (Speech Therapy)
- أ. عبدالله العتيبي - تعديل السلوك (Behavior Modification)
- أ. ريم بخاش - العلاج الوظيفي (Occupational Therapy)

عند طلب حجز موعد:
1. اسأل عن: اسم المريض، رقم الجوال، نوع الخدمة المطلوبة، التاريخ والوقت المفضل
2. تأكد من توفر الأخصائي في الوقت المطلوب
3. عندما تكتمل جميع المعلومات، قل:

[BOOKING_READY]
{
  "patient_name": "اسم المريض",
  "phone": "رقم الجوال",
  "specialist": "اسم الأخصائي",
  "service": "نوع الخدمة",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}

ملاحظات مهمة:
- كن مهذباً ومتعاطفاً دائماً
- إذا كانت المعلومات ناقصة، اسأل بلطف
- قدم خيارات واضحة للمريض
- أكد على سرية المعلومات الطبية
- في حالة الطوارئ، انصح بالاتصال فوراً أو زيارة أقرب مستشفى`

  let prompt = systemPrompt

  // Add conversation history if available
  if (conversationHistory && conversationHistory.length > 0) {
    const historyText = conversationHistory
      .slice(-10) // Last 10 messages only
      .map((msg) => `${msg.role === 'user' ? 'المريض' : 'المساعد'}: ${msg.content}`)
      .join('\n')
    prompt += `\n\nتاريخ المحادثة السابقة:\n${historyText}\n\nالرسالة الجديدة من المريض: ${userMessage}`
  } else {
    prompt += `\n\nرسالة المريض: ${userMessage}`
  }

  return await askAI(prompt, `User phone: ${userPhone}`)
}
