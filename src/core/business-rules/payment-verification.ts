/**
 * Payment Verification Service
 * التحقق من الدفع قبل فتح الجلسة
 */

import { supabaseAdmin } from '@/lib/supabase'
import { businessRulesEngine } from './engine'

export interface PaymentVerificationResult {
  canProceed: boolean
  reason: string
  requiredActions: string[]
  paymentStatus?: {
    paid: boolean
    amount: number
    invoiceId?: string
    insuranceApproved?: boolean
    insuranceClaimId?: string
  }
}

export class PaymentVerificationService {
  /**
   * Verify if patient can proceed to doctor session
   */
  async verifyPayment(
    patientId: string,
    sessionType: string,
    serviceType?: string
  ): Promise<PaymentVerificationResult> {
    // Check if first visit (free consultation)
    const isFirstVisit = await this.isFirstVisit(patientId)

    if (isFirstVisit && sessionType === 'consultation') {
      return {
        canProceed: true,
        reason: 'أول زيارة كشف مجاني',
        requiredActions: []
      }
    }

    // Check payment status
    const paymentStatus = await this.getPaymentStatus(patientId, serviceType)

    // Check insurance approval if applicable
    const insuranceStatus = await this.getInsuranceStatus(patientId)

    // Evaluate business rules
    const ruleResults = await businessRulesEngine.evaluate(
      'open_session',
      {
        patient: {
          id: patientId,
          is_first_visit: isFirstVisit
        },
        session: {
          type: sessionType,
          service_type: serviceType
        },
        payment: {
          paid: paymentStatus.paid,
          amount: paymentStatus.amount,
          invoice_id: paymentStatus.invoiceId
        },
        insurance: {
          approved: insuranceStatus.approved,
          claim_id: insuranceStatus.claimId
        }
      },
      'reception'
    )

    // Check if any rule blocks the action
    const blockingRule = ruleResults.find(r => !r.passed && r.action === 'block')
    if (blockingRule) {
      return {
        canProceed: false,
        reason: blockingRule.message || 'لا يمكن المتابعة',
        requiredActions: blockingRule.required_fields || [],
        paymentStatus: {
          paid: paymentStatus.paid,
          amount: paymentStatus.amount,
          invoiceId: paymentStatus.invoiceId,
          insuranceApproved: insuranceStatus.approved,
          insuranceClaimId: insuranceStatus.claimId
        }
      }
    }

    // Check if payment or insurance approval is required
    if (!paymentStatus.paid && !insuranceStatus.approved) {
      return {
        canProceed: false,
        reason: 'يجب دفع الرسوم أو الحصول على موافقة التأمين',
        requiredActions: ['payment', 'insurance_approval'],
        paymentStatus: {
          paid: false,
          amount: paymentStatus.amount,
          insuranceApproved: false
        }
      }
    }

    return {
      canProceed: true,
      reason: paymentStatus.paid ? 'تم الدفع' : 'موافقة التأمين موجودة',
      requiredActions: [],
      paymentStatus: {
        paid: paymentStatus.paid,
        amount: paymentStatus.amount,
        invoiceId: paymentStatus.invoiceId,
        insuranceApproved: insuranceStatus.approved,
        insuranceClaimId: insuranceStatus.claimId
      }
    }
  }

  /**
   * Check if this is patient's first visit
   */
  private async isFirstVisit(patientId: string): Promise<boolean> {
    try {
      // Check if patient has any previous sessions
      const { data: sessions, error } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('patient_id', patientId)
        .limit(1)

      if (error) throw error

      return !sessions || sessions.length === 0
    } catch (error) {
      console.error('Error checking first visit:', error)
      return false
    }
  }

  /**
   * Get payment status for patient
   */
  private async getPaymentStatus(
    patientId: string,
    serviceType?: string
  ): Promise<{
    paid: boolean
    amount: number
    invoiceId?: string
  }> {
    try {
      // Get patient info
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('name, phone')
        .eq('id', patientId)
        .single()

      if (!patient) {
        return { paid: false, amount: 0 }
      }

      // Check for unpaid invoices
      const { data: invoices } = await supabaseAdmin
        .from('billing')
        .select('id, amount, paid, invoice_number')
        .eq('patient_name', patient.name)
        .eq('paid', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (invoices && invoices.length > 0) {
        return {
          paid: false,
          amount: invoices[0].amount || 0,
          invoiceId: invoices[0].id
        }
      }

      return { paid: true, amount: 0 }
    } catch (error) {
      console.error('Error getting payment status:', error)
      return { paid: false, amount: 0 }
    }
  }

  /**
   * Get insurance approval status
   */
  private async getInsuranceStatus(patientId: string): Promise<{
    approved: boolean
    claimId?: string
  }> {
    try {
      // Check for approved insurance claims
      const { data: claims } = await supabaseAdmin
        .from('insurance_claims')
        .select('id, status')
        .eq('patient_id', patientId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)

      if (claims && claims.length > 0) {
        return {
          approved: true,
          claimId: claims[0].id
        }
      }

      return { approved: false }
    } catch (error) {
      console.error('Error getting insurance status:', error)
      return { approved: false }
    }
  }
}

export const paymentVerificationService = new PaymentVerificationService()
