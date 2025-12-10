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
import { supabaseAdmin } from './supabase'

/**
 * Get primary admin phone from database
 */
async function getAdminPhone(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('admin_contacts')
      .select('phone')
      .eq('is_primary', true)
      .eq('is_active', true)
      .single()

    if (data?.phone) {
      return data.phone
    }

    // Fallback to settings
    const settings = await getSettings()
    return settings.ADMIN_PHONE || process.env.ADMIN_PHONE || '966581421483'
  } catch (error) {
    console.error('Error fetching admin phone:', error)
    return '966581421483' // Final fallback
  }
}

/**
 * Ask AI a question with automatic fallback
 * @param prompt - The question/prompt to send to AI
 * @param context - Optional context for the conversation
 * @returns AI response text
 */
export async function askAI(prompt: string, context?: string): Promise<AIResponse> {
  const settings = await getSettings()
  
  // Get keys from database settings (centralized configuration)
  const GEMINI_KEY = settings.GEMINI_KEY
  const OPENAI_KEY = settings.OPENAI_KEY

  const ADMIN_PHONE = await getAdminPhone()

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
              'أنت مساعد طبي لمركز الهمم في جدة، المملكة العربية السعودية. استخدم لهجة جدة الخفيفة والودودة والاحترافية. كن مهذباً ومتعاطفاً ومهتماً. رد بالعربية أو الإنجليزية حسب لغة المستخدم.',
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
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  patientName?: string
): Promise<AIResponse> {
    // Get prompt template from database
    const { getAIPromptTemplate } = await import('./ai-prompts')
    
    // Fetch dynamic data from database
    const [centerInfo, services, specialists, workingHours] = await Promise.all([
      supabaseAdmin.from('center_info').select('*').limit(1).maybeSingle(),
      supabaseAdmin.from('service_types').select('*').eq('is_active', true).order('order_index'),
      supabaseAdmin.from('users').select('id, name, role').eq('role', 'doctor'),
      supabaseAdmin.from('working_hours').select('*').eq('is_working_day', true).order('day_of_week'),
    ])

    const center = centerInfo.data
    const servicesList = (services.data || [])
      .map((s, i) => `${i + 1}. ${s.name_ar}${s.description_ar ? ` - ${s.description_ar}` : ''}`)
      .join('\n')
    
    // Get doctor profiles for specialization
    const doctorIds = (specialists.data || []).map(s => s.id)
    const { data: profiles } = await supabaseAdmin
      .from('doctor_profiles')
      .select('user_id, specialization')
      .in('user_id', doctorIds)

    const profilesMap = new Map(profiles?.map(p => [p.user_id, p.specialization]) || [])
    const specialistsList = (specialists.data || [])
      .map((s) => {
        const specialization = profilesMap.get(s.id)
        return `- ${s.name}${specialization ? ` - ${specialization}` : ''}`
      })
      .join('\n')

    const hours = workingHours.data || []
    const workingHoursText = hours.length > 0
      ? `${hours.map(h => {
          const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
          return `${days[h.day_of_week]}: ${h.start_time} - ${h.end_time}`
        }).join('، ')}`
      : 'الأحد-الخميس، 9 صباحاً - 5 مساءً'

    // Build variables for prompt template
    const variables = {
      center_phone: center?.phone || '+966 12 345 6789',
      center_email: center?.email || 'info@al-himam.com',
      center_address: center?.address_ar || 'جدة، المملكة العربية السعودية',
      working_hours: workingHoursText,
      services_list: servicesList || 'الخدمات متاحة حسب الجدول',
      specialists_list: specialistsList || 'الأخصائيون متاحون حسب الجدول',
    }

    // Get prompt template from database
    let systemPrompt = await getAIPromptTemplate('whatsapp_assistant', variables)

  let prompt = systemPrompt

  if (patientName) {
     prompt += `\n\n[SYSTEM INFO]: The user is a registered patient named "${patientName}". Welcome them back by name. You do NOT need to ask for their name/phone again.`
  }

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
