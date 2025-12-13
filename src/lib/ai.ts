/**
 * AI Service
 * Handles all AI interactions with automatic model fallback
 * Supports Gemini (multiple models) and OpenAI with intelligent fallback
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { getSettings } from './config'
import { sendTextMessage } from './whatsapp-messaging'
import { supabaseAdmin } from './supabase'
import { logError, logInfo, logWarn } from '@/shared/utils/logger'

export type AIModel = 'gemini' | 'openai' | 'auto'

export interface AIResponse {
  text: string
  model: 'gemini' | 'openai'
  error?: string
}

/**
 * Gemini models ordered by preference (newest to oldest)
 */
const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',  // Latest experimental
  'gemini-2.0-flash',      // Stable 2.0
  'gemini-1.5-flash',      // Fallback 1.5
  'gemini-1.5-pro',        // Pro version
  'gemini-pro',            // Legacy
] as const

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

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

    const settings = await getSettings()
    return settings.ADMIN_PHONE || process.env.ADMIN_PHONE || '966581421483'
  } catch (error) {
    logError('Error fetching admin phone', error)
    return '966581421483'
  }
}

/**
 * Ask AI a question with automatic fallback
 * @param prompt - The question/prompt to send to AI
 * @param context - Optional context for the conversation
 * @param preferredModel - Optional preferred model (overrides settings)
 * @returns AI response text
 */
export async function askAI(
  prompt: string, 
  context?: string,
  preferredModel?: AIModel
): Promise<AIResponse> {
  const settings = await getSettings()
  
  // Get keys and model preference from database settings
  const GEMINI_KEY = settings.GEMINI_KEY
  const OPENAI_KEY = settings.OPENAI_KEY
  const AI_MODEL = (preferredModel || settings.AI_MODEL || 'auto') as AIModel

  const ADMIN_PHONE = await getAdminPhone()

  // Validation
  if (!GEMINI_KEY && !OPENAI_KEY) {
    const errorMsg = 'CRITICAL: No AI API Keys found in Database Settings table.'
    logError(errorMsg)
    await sendTextMessage(ADMIN_PHONE, `⚠️ System Alert:\n${errorMsg}`)
    return {
      text: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.',
      model: 'openai',
      error: 'No AI service configured',
    }
  }

  /**
   * Try Gemini with specific model
   */
  const tryGeminiModel = async (modelName: string): Promise<AIResponse | null> => {
    if (!GEMINI_KEY) return null
    
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY)
      const model = genAI.getGenerativeModel({ model: modelName })
      const fullPrompt = context ? `Context: ${context}\n\nUser message: ${prompt}` : prompt
      const result = await model.generateContent(fullPrompt)
      const text = result.response.text()

      logInfo(`Gemini model ${modelName} succeeded`)
      return { text, model: 'gemini' }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logWarn(`Gemini model ${modelName} failed: ${errorMessage}`)
      return null
    }
  }

  /**
   * Try Gemini with optional auto-fallback between models
   */
  const tryGemini = async (autoMode: boolean = false): Promise<AIResponse | null> => {
    if (!GEMINI_KEY) return null
    
    if (autoMode) {
      // Try all Gemini models in order until one succeeds
      for (const modelName of GEMINI_MODELS) {
        const result = await tryGeminiModel(modelName)
        if (result) return result
      }
      logWarn('All Gemini models failed')
      return null
    }
    
    // Use default model
    return await tryGeminiModel(DEFAULT_GEMINI_MODEL)
  }

  /**
   * Try OpenAI
   */
  const tryOpenAI = async (): Promise<AIResponse | null> => {
    if (!OPENAI_KEY) return null
    
    try {
      const openai = new OpenAI({ apiKey: OPENAI_KEY })
      const systemPrompt = 'أنت مساعد طبي لمركز الهمم في جدة، المملكة العربية السعودية. استخدم لهجة جدة الخفيفة والودودة والاحترافية. كن مهذباً ومتعاطفاً ومهتماً. رد بالعربية أو الإنجليزية حسب لغة المستخدم.'
      
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ]
      
      if (context) {
        messages.push({ role: 'system', content: `Context: ${context}` })
      }
      
      messages.push({ role: 'user', content: prompt })

      const completion = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages,
        temperature: 0.7,
      })

      const text = completion.choices[0]?.message?.content || 'AI response unavailable'
      return { text, model: 'openai' }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError('OpenAI API error', error)
      await sendTextMessage(ADMIN_PHONE, `⚠️ OpenAI Error:\n${errorMessage}`)
      return null
    }
  }

  // Handle model selection based on AI_MODEL setting
  switch (AI_MODEL) {
    case 'gemini': {
      // Gemini only: try all Gemini models, no OpenAI fallback
      const result = await tryGemini(true)
      if (result) return result
      break
    }
    
    case 'openai': {
      // OpenAI only: no Gemini fallback
      const result = await tryOpenAI()
      if (result) return result
      break
    }
    
    case 'auto':
    default: {
      // Auto mode: try Gemini models first, then OpenAI
      if (GEMINI_KEY) {
        const result = await tryGemini(true)
        if (result) return result
      }
      
      if (OPENAI_KEY) {
        logInfo('All Gemini models failed, trying OpenAI...')
        const result = await tryOpenAI()
        if (result) return result
      }
      break
    }
  }

  // All models failed
  return {
    text: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.',
    model: 'openai',
    error: 'No AI service configured or all models failed',
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
