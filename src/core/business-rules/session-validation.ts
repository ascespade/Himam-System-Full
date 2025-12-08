/**
 * Session Data Validation Service
 * التحقق من اكتمال بيانات الجلسة قبل الحفظ
 * يستخدم AI Agent للتحقق من اكتمال البيانات
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface SessionValidationResult {
  isValid: boolean
  isComplete: boolean
  missingFields: string[]
  warnings: string[]
  suggestions: string[]
  aiConfidence?: number
}

export interface SessionData {
  patient_id: string
  doctor_id: string
  session_type: string
  service_type?: string
  chief_complaint?: string
  assessment?: string
  plan?: string
  notes?: string
  diagnosis?: string
  treatment?: string
  insurance_claim_id?: string
}

export class SessionValidationService {
  /**
   * Validate session data completeness
   */
  async validateSessionData(
    sessionData: SessionData,
    insuranceProvider?: string
  ): Promise<SessionValidationResult> {
    // Basic validation
    const basicValidation = this.validateBasicFields(sessionData)
    if (!basicValidation.isValid) {
      return basicValidation
    }

    // AI Agent validation
    const aiValidation = await this.validateWithAI(sessionData, insuranceProvider)

    // Template-based validation (learned from previous successful claims)
    const templateValidation = await this.validateWithTemplate(sessionData, insuranceProvider)

    // Combine results
    return {
      isValid: aiValidation.isValid && templateValidation.isValid,
      isComplete: aiValidation.isComplete && templateValidation.isComplete,
      missingFields: [
        ...aiValidation.missingFields,
        ...templateValidation.missingFields
      ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      warnings: [
        ...aiValidation.warnings,
        ...templateValidation.warnings
      ],
      suggestions: [
        ...aiValidation.suggestions,
        ...templateValidation.suggestions
      ],
      aiConfidence: aiValidation.aiConfidence
    }
  }

  /**
   * Basic field validation
   */
  private validateBasicFields(sessionData: SessionData): SessionValidationResult {
    const requiredFields = ['patient_id', 'doctor_id', 'session_type']
    const missingFields: string[] = []

    for (const field of requiredFields) {
      if (!sessionData[field as keyof SessionData]) {
        missingFields.push(field)
      }
    }

    return {
      isValid: missingFields.length === 0,
      isComplete: false,
      missingFields,
      warnings: [],
      suggestions: []
    }
  }

  /**
   * Validate with AI Agent
   */
  private async validateWithAI(
    sessionData: SessionData,
    insuranceProvider?: string
  ): Promise<SessionValidationResult> {
    try {
      // Call AI Agent for validation
      const response = await fetch('/api/doctor/insurance/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_session',
          session_data: sessionData,
          insurance_provider: insuranceProvider
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        return {
          isValid: data.data.is_valid || false,
          isComplete: data.data.is_complete || false,
          missingFields: data.data.missing_fields || [],
          warnings: data.data.warnings || [],
          suggestions: data.data.suggestions || [],
          aiConfidence: data.data.confidence
        }
      }

      // Fallback if AI fails
      return this.fallbackValidation(sessionData)
    } catch (error) {
      console.error('AI validation error:', error)
      return this.fallbackValidation(sessionData)
    }
  }

  /**
   * Validate against learned templates
   */
  private async validateWithTemplate(
    sessionData: SessionData,
    insuranceProvider?: string
  ): Promise<SessionValidationResult> {
    try {
      if (!insuranceProvider) {
        return { isValid: true, isComplete: true, missingFields: [], warnings: [], suggestions: [] }
      }

      // Get successful template for this insurance provider and service type
      const { data: template } = await supabaseAdmin
        .from('insurance_claim_templates')
        .select('*')
        .eq('insurance_provider', insuranceProvider)
        .eq('service_type', sessionData.service_type || '')
        .eq('is_successful', true)
        .order('success_rate', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!template) {
        return { isValid: true, isComplete: true, missingFields: [], warnings: [], suggestions: [] }
      }

      const requiredFields = template.required_fields || []
      const missingFields: string[] = []
      const warnings: string[] = []

      // Check required fields
      for (const field of requiredFields) {
        if (!sessionData[field as keyof SessionData]) {
          missingFields.push(field)
        }
      }

      // Check for common rejection patterns
      const rejectionPatterns = template.rejection_patterns || []
      for (const pattern of rejectionPatterns) {
        if (this.matchesPattern(sessionData, pattern)) {
          warnings.push(`تحذير: ${pattern.warning_message}`)
        }
      }

      return {
        isValid: missingFields.length === 0,
        isComplete: missingFields.length === 0,
        missingFields,
        warnings,
        suggestions: template.suggestions || []
      }
    } catch (error) {
      console.error('Template validation error:', error)
      return { isValid: true, isComplete: true, missingFields: [], warnings: [], suggestions: [] }
    }
  }

  /**
   * Check if session data matches a rejection pattern
   */
  private matchesPattern(sessionData: SessionData, pattern: any): boolean {
    if (pattern.field && pattern.value) {
      const fieldValue = sessionData[pattern.field as keyof SessionData]
      if (pattern.operator === 'contains') {
        return typeof fieldValue === 'string' && fieldValue.includes(pattern.value)
      }
      if (pattern.operator === 'equals') {
        return fieldValue === pattern.value
      }
    }
    return false
  }

  /**
   * Fallback validation if AI fails
   */
  private fallbackValidation(sessionData: SessionData): SessionValidationResult {
    const requiredForInsurance = ['chief_complaint', 'assessment', 'plan', 'diagnosis']
    const missingFields: string[] = []

    // Check if insurance claim exists
    if (sessionData.insurance_claim_id) {
      for (const field of requiredForInsurance) {
        if (!sessionData[field as keyof SessionData]) {
          missingFields.push(field)
        }
      }
    }

    return {
      isValid: missingFields.length === 0,
      isComplete: missingFields.length === 0,
      missingFields,
      warnings: [],
      suggestions: []
    }
  }
}

export const sessionValidationService = new SessionValidationService()
