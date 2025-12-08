/**
 * Template Learning System
 * نظام التعلم من المطالبات السابقة الناجحة
 * يبني templates ديناميكية بناءً على المطالبات المنجحة
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface ClaimTemplate {
  id: string
  insurance_provider: string
  service_type: string
  required_fields: string[]
  recommended_fields: string[]
  rejection_patterns: Array<{
    field: string
    operator: string
    value: string
    warning_message: string
  }>
  success_patterns: Array<{
    field: string
    value: string
    frequency: number
  }>
  success_rate: number
  sample_count: number
  last_updated: string
}

export class TemplateLearningService {
  /**
   * Learn from successful claims and update templates
   */
  async learnFromSuccessfulClaim(
    claimId: string,
    insuranceProvider: string,
    serviceType: string
  ): Promise<void> {
    try {
      // Get claim data
      const { data: claim } = await supabaseAdmin
        .from('insurance_claims')
        .select('*, sessions(*)')
        .eq('id', claimId)
        .single()

      if (!claim || claim.status !== 'approved') {
        return // Only learn from approved claims
      }

      // Get or create template
      let { data: template } = await supabaseAdmin
        .from('insurance_claim_templates')
        .select('*')
        .eq('insurance_provider', insuranceProvider)
        .eq('service_type', serviceType)
        .maybeSingle()

      if (!template) {
        // Create new template
        const { data: newTemplate } = await supabaseAdmin
          .from('insurance_claim_templates')
          .insert({
            insurance_provider: insuranceProvider,
            service_type: serviceType,
            required_fields: this.extractRequiredFields(claim),
            recommended_fields: [],
            rejection_patterns: [],
            success_patterns: [],
            success_rate: 1.0,
            sample_count: 1,
            is_successful: true
          })
          .select()
          .single()

        template = newTemplate
      } else {
        // Update existing template
        const updatedFields = this.mergeFields(template.required_fields, this.extractRequiredFields(claim))
        const updatedPatterns = this.updateSuccessPatterns(template.success_patterns, claim)
        
        const newSampleCount = (template.sample_count || 0) + 1
        const newSuccessRate = ((template.success_rate || 0) * (newSampleCount - 1) + 1) / newSampleCount

        await supabaseAdmin
          .from('insurance_claim_templates')
          .update({
            required_fields: updatedFields,
            success_patterns: updatedPatterns,
            success_rate: newSuccessRate,
            sample_count: newSampleCount,
            last_updated: new Date().toISOString()
          })
          .eq('id', template.id)
      }
    } catch (error) {
      console.error('Error learning from successful claim:', error)
    }
  }

  /**
   * Learn from rejected claims to avoid patterns
   */
  async learnFromRejectedClaim(
    claimId: string,
    insuranceProvider: string,
    serviceType: string,
    rejectionReason?: string
  ): Promise<void> {
    try {
      // Get claim data
      const { data: claim } = await supabaseAdmin
        .from('insurance_claims')
        .select('*, sessions(*)')
        .eq('id', claimId)
        .single()

      if (!claim || claim.status !== 'rejected') {
        return
      }

      // Get template
      const { data: template } = await supabaseAdmin
        .from('insurance_claim_templates')
        .select('*')
        .eq('insurance_provider', insuranceProvider)
        .eq('service_type', serviceType)
        .maybeSingle()

      if (template) {
        // Add rejection pattern
        const rejectionPatterns = template.rejection_patterns || []
        
        if (rejectionReason) {
          // Extract pattern from rejection reason
          const pattern = this.extractRejectionPattern(claim, rejectionReason)
          if (pattern) {
            rejectionPatterns.push(pattern)
          }
        }

        await supabaseAdmin
          .from('insurance_claim_templates')
          .update({
            rejection_patterns: rejectionPatterns,
            last_updated: new Date().toISOString()
          })
          .eq('id', template.id)
      }
    } catch (error) {
      console.error('Error learning from rejected claim:', error)
    }
  }

  /**
   * Get best template for insurance provider and service
   */
  async getBestTemplate(
    insuranceProvider: string,
    serviceType: string
  ): Promise<ClaimTemplate | null> {
    try {
      const { data: template } = await supabaseAdmin
        .from('insurance_claim_templates')
        .select('*')
        .eq('insurance_provider', insuranceProvider)
        .eq('service_type', serviceType)
        .eq('is_successful', true)
        .order('success_rate', { ascending: false })
        .order('sample_count', { ascending: false })
        .limit(1)
        .maybeSingle()

      return template as ClaimTemplate | null
    } catch (error) {
      console.error('Error getting template:', error)
      return null
    }
  }

  /**
   * Extract required fields from successful claim
   */
  private extractRequiredFields(claim: any): string[] {
    const fields: string[] = []
    
    if (claim.chief_complaint) fields.push('chief_complaint')
    if (claim.assessment) fields.push('assessment')
    if (claim.plan) fields.push('plan')
    if (claim.diagnosis) fields.push('diagnosis')
    if (claim.treatment) fields.push('treatment')
    if (claim.medical_necessity) fields.push('medical_necessity')
    if (claim.progress_notes) fields.push('progress_notes')

    return fields
  }

  /**
   * Merge fields from new claim with existing template
   */
  private mergeFields(existing: string[], newFields: string[]): string[] {
    const merged = [...existing]
    for (const field of newFields) {
      if (!merged.includes(field)) {
        merged.push(field)
      }
    }
    return merged
  }

  /**
   * Update success patterns
   */
  private updateSuccessPatterns(
    existingPatterns: any[],
    claim: any
  ): any[] {
    const patterns = [...(existingPatterns || [])]
    
    // Extract patterns from claim
    const claimPatterns = this.extractSuccessPatterns(claim)
    
    for (const pattern of claimPatterns) {
      const existing = patterns.find(p => p.field === pattern.field && p.value === pattern.value)
      if (existing) {
        existing.frequency = (existing.frequency || 0) + 1
      } else {
        patterns.push({ ...pattern, frequency: 1 })
      }
    }

    return patterns
  }

  /**
   * Extract success patterns from claim
   */
  private extractSuccessPatterns(claim: any): any[] {
    const patterns: any[] = []
    
    // Extract key-value patterns
    if (claim.chief_complaint) {
      patterns.push({
        field: 'chief_complaint',
        value: claim.chief_complaint.substring(0, 50) // First 50 chars
      })
    }

    if (claim.diagnosis) {
      patterns.push({
        field: 'diagnosis',
        value: claim.diagnosis
      })
    }

    return patterns
  }

  /**
   * Extract rejection pattern from rejection reason
   */
  private extractRejectionPattern(claim: any, rejectionReason: string): any | null {
    // Simple pattern extraction - can be enhanced with NLP
    if (rejectionReason.includes('missing') || rejectionReason.includes('مفقود')) {
      // Try to identify which field is missing
      const missingField = this.identifyMissingField(rejectionReason)
      if (missingField) {
        return {
          field: missingField,
          operator: 'exists',
          value: 'false',
          warning_message: `تأكد من وجود ${missingField}`
        }
      }
    }

    return null
  }

  /**
   * Identify missing field from rejection reason
   */
  private identifyMissingField(reason: string): string | null {
    const fieldMap: Record<string, string> = {
      'complaint': 'chief_complaint',
      'assessment': 'assessment',
      'plan': 'plan',
      'diagnosis': 'diagnosis',
      'treatment': 'treatment',
      'necessity': 'medical_necessity'
    }

    for (const [key, field] of Object.entries(fieldMap)) {
      if (reason.toLowerCase().includes(key)) {
        return field
      }
    }

    return null
  }
}

export const templateLearningService = new TemplateLearningService()
