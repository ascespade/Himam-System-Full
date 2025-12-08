/**
 * AI Prompts Service
 * Centralized AI prompt management from database
 */
import { supabaseAdmin } from './supabase'

export interface AIPromptTemplate {
  id: string
  name: string
  category: string
  system_prompt: string
  language: string
  dialect: string
  variables: Record<string, any>
  is_active: boolean
  version: number
}

/**
 * Get AI prompt template from database
 */
export async function getAIPromptTemplate(
  name: string,
  variables?: Record<string, string>
): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('system_prompt, variables')
      .eq('name', name)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('Error fetching AI prompt template:', error)
      // Fallback to default
      return getDefaultPrompt(name)
    }

    let prompt = data.system_prompt

    // Replace variables
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
      })
    }

    // Replace default variables from database
    const defaultVars = data.variables || {}
    Object.entries(defaultVars).forEach(([key, value]) => {
      if (!variables || !variables[key]) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''))
      }
    })

    return prompt
  } catch (error) {
    console.error('Error in getAIPromptTemplate:', error)
    return getDefaultPrompt(name)
  }
}

/**
 * Get default prompt (fallback)
 */
function getDefaultPrompt(name: string): string {
  const defaults: Record<string, string> = {
    whatsapp_assistant: `أنت مساعد ذكي لمركز الهمم الطبي في جدة، المملكة العربية السعودية.

مهمتك الأساسية:
- الرد على استفسارات المرضى بشكل مهني ومتعاطف
- مساعدة المرضى في حجز المواعيد
- تقديم معلومات عن الخدمات الطبية المتاحة
- الرد بنفس لغة المريض تماماً (عربي -> عربي، إنجليزي -> إنجليزي)

استخدم لهجة جدة الخفيفة والودودة (مثل: "أهلاً وسهلاً"، "الله يعطيك العافية"، "إن شاء الله").`,
    doctor_assistant: `أنت مساعد ذكي للطبيب في مركز الهمم بجدة. استخدم لهجة جدة الخفيفة والاحترافية.`,
    auto_documentation: `أنت مساعد طبي متخصص في توثيق الجلسات والخطط العلاجية لمركز الهمم بجدة. استخدم لهجة جدة الخفيفة والاحترافية.`,
  }

  return defaults[name] || defaults.whatsapp_assistant
}

/**
 * Get all active prompt templates
 */
export async function getAllPromptTemplates(): Promise<AIPromptTemplate[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching prompt templates:', error)
    return []
  }
}

