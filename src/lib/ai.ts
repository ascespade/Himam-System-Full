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

/**
 * Ask AI a question with automatic fallback
 * @param prompt - The question/prompt to send to AI
 * @param context - Optional context for the conversation
 * @returns AI response text
 */
export async function askAI(prompt: string, context?: string): Promise<AIResponse> {
  const settings = await getSettings()

  // Try Gemini first (primary)
  if (settings.GEMINI_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(settings.GEMINI_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

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
      // Fall through to OpenAI fallback
    }
  }

  // Fallback to OpenAI
  if (settings.OPENAI_KEY) {
    try {
      const openai = new OpenAI({ apiKey: settings.OPENAI_KEY })
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
      return {
        text: 'عذراً، لا يمكنني الرد في الوقت الحالي. يرجى المحاولة لاحقاً.',
        model: 'openai',
        error: error.message || 'AI service unavailable',
      }
    }
  }

  // No AI service configured
  return {
    text: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.',
    model: 'openai',
    error: 'No AI service configured',
  }
}

/**
 * Generate AI response for WhatsApp messages
 * @param userMessage - User's WhatsApp message
 * @param userPhone - User's phone number
 * @param conversationHistory - Previous messages in the conversation
 * @returns AI response
 */
export async function generateWhatsAppResponse(
  userMessage: string,
  userPhone: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AIResponse> {
  const systemPrompt = `أنت مساعد ذكي لمركز الهمم الطبي في جدة، المملكة العربية السعودية.
  
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

كن مهذباً، مفيداً، ومهتماً بصحة المرضى.`

  let prompt = systemPrompt

  // Add conversation history if available
  if (conversationHistory && conversationHistory.length > 0) {
    const historyText = conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'المريض' : 'المساعد'}: ${msg.content}`)
      .join('\n')
    prompt += `\n\nتاريخ المحادثة:\n${historyText}\n\nالرسالة الجديدة من المريض: ${userMessage}`
  } else {
    prompt += `\n\nرسالة المريض: ${userMessage}`
  }

  return await askAI(prompt, `User phone: ${userPhone}`)
}



