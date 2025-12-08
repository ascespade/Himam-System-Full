/**
 * Business Rules Engine
 * نظام القواعد التجارية الديناميكي للمركز الطبي
 * يدعم قواعد قابلة للتعديل من Admin
 */

import { supabaseAdmin } from '@/lib/supabase'

export type RuleType = 
  | 'payment_required'
  | 'insurance_approval_required'
  | 'first_visit_free'
  | 'session_data_complete'
  | 'insurance_template_match'
  | 'error_pattern_avoid'

export type RuleAction = 'allow' | 'block' | 'warn' | 'require_approval'

export interface BusinessRule {
  id: string
  name: string
  description: string
  type: RuleType
  condition: string // JSON string for complex conditions
  action: RuleAction
  priority: number // Higher = more important
  is_active: boolean
  applies_to: string[] // ['reception', 'doctor', 'billing']
  error_message?: string
  created_at: string
  updated_at: string
}

export interface RuleEvaluationResult {
  passed: boolean
  action: RuleAction
  message?: string
  required_fields?: string[]
  warnings?: string[]
}

export class BusinessRulesEngine {
  private rules: BusinessRule[] = []
  private cacheExpiry: number = 0
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes

  /**
   * Load rules from database
   */
  async loadRules(): Promise<void> {
    const now = Date.now()
    if (this.rules.length > 0 && now < this.cacheExpiry) {
      return // Use cached rules
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('business_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) throw error

      this.rules = (data || []) as BusinessRule[]
      this.cacheExpiry = now + this.cacheTTL
    } catch (error) {
      console.error('Error loading business rules:', error)
      // Use default rules if database fails
      this.rules = this.getDefaultRules()
    }
  }

  /**
   * Evaluate rules for a specific action
   */
  async evaluate(
    action: string,
    context: Record<string, unknown>,
    userRole?: string
  ): Promise<RuleEvaluationResult[]> {
    await this.loadRules()

    const relevantRules = this.rules.filter(rule => {
      // Check if rule applies to this action/role
      if (userRole && !rule.applies_to.includes(userRole) && !rule.applies_to.includes('all')) {
        return false
      }
      return true
    })

    const results: RuleEvaluationResult[] = []

    for (const rule of relevantRules) {
      const result = await this.evaluateRule(rule, context)
      if (result) {
        results.push(result)
      }
    }

    return results
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(
    rule: BusinessRule,
    context: Record<string, unknown>
  ): Promise<RuleEvaluationResult | null> {
    try {
      const condition = JSON.parse(rule.condition)
      const passed = this.checkCondition(condition, context)

      if (!passed) {
        return {
          passed: false,
          action: rule.action,
          message: rule.error_message || `Rule violation: ${rule.name}`,
          required_fields: condition.required_fields || []
        }
      }

      return {
        passed: true,
        action: rule.action,
        message: undefined
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error)
      return null
    }
  }

  /**
   * Check if condition is met
   */
  private checkCondition(condition: any, context: Record<string, unknown>): boolean {
    if (!condition || typeof condition !== 'object') return true

    // Check all conditions
    if (condition.and) {
      return condition.and.every((c: any) => this.checkCondition(c, context))
    }

    if (condition.or) {
      return condition.or.some((c: any) => this.checkCondition(c, context))
    }

    // Field checks
    if (condition.field) {
      const value = this.getNestedValue(context, condition.field)
      
      if (condition.equals !== undefined) {
        return value === condition.equals
      }
      
      if (condition.not_equals !== undefined) {
        return value !== condition.not_equals
      }
      
      if (condition.exists !== undefined) {
        return condition.exists ? value !== undefined && value !== null : value === undefined || value === null
      }
      
      if (condition.in !== undefined) {
        return Array.isArray(condition.in) && condition.in.includes(value)
      }
      
      if (condition.not_in !== undefined) {
        return !Array.isArray(condition.not_in) || !condition.not_in.includes(value)
      }
    }

    return true
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: any, key: string) => current?.[key], obj)
  }

  /**
   * Get default rules (fallback if database fails)
   */
  private getDefaultRules(): BusinessRule[] {
    return [
      {
        id: 'default_first_visit_free',
        name: 'أول زيارة كشف مجاني',
        description: 'السماح بفتح جلسة بدون دفع للزيارة الأولى',
        type: 'first_visit_free',
        condition: JSON.stringify({
          and: [
            { field: 'patient.is_first_visit', equals: true },
            { field: 'session_type', equals: 'consultation' }
          ]
        }),
        action: 'allow',
        priority: 10,
        is_active: true,
        applies_to: ['reception', 'doctor'],
        error_message: 'أول زيارة كشف مجاني - لا يتطلب دفع'
      },
      {
        id: 'default_payment_required',
        name: 'الدفع مطلوب قبل الجلسة',
        description: 'منع فتح جلسة بدون دفع الرسوم (ما عدا أول زيارة)',
        type: 'payment_required',
        condition: JSON.stringify({
          and: [
            { field: 'patient.is_first_visit', not_equals: true },
            { field: 'payment.paid', not_equals: true },
            { field: 'payment.insurance_approved', not_equals: true }
          ]
        }),
        action: 'block',
        priority: 20,
        is_active: true,
        applies_to: ['reception', 'doctor'],
        error_message: 'يجب دفع الرسوم أو الحصول على موافقة التأمين قبل فتح الجلسة'
      }
    ]
  }
}

// Singleton instance
export const businessRulesEngine = new BusinessRulesEngine()
