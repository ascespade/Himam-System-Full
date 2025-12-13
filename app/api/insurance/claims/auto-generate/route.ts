import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/insurance/claims/auto-generate
 * Auto-generate insurance claim when doctor approves treatment plan with sessions
 * يتم استدعاؤه تلقائياً عند موافقة الطبيب على خطة علاجية تحتوي على جلسات
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, options: CookieOptions) {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      treatment_plan_id,
      patient_id,
      requested_sessions,
      session_dates,
      doctor_notes,
      medical_justification
    } = body

    if (!treatment_plan_id || !patient_id || !requested_sessions) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get patient insurance info
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select(`
        *,
        patient_insurance (*)
      `)
      .eq('id', patient_id)
      .single()

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Get insurance company
    const insuranceInfo = patient.patient_insurance?.[0]
    if (!insuranceInfo || !insuranceInfo.insurance_provider) {
      return NextResponse.json(
        { success: false, error: 'Patient has no insurance information' },
        { status: 400 }
      )
    }

    const { data: insuranceCompany } = await supabaseAdmin
      .from('insurance_companies')
      .select('*')
      .eq('name', insuranceInfo.insurance_provider)
      .eq('is_active', true)
      .single()

    // Get treatment plan details
    const { data: treatmentPlan } = await supabaseAdmin
      .from('treatment_plans')
      .select('*, goals(*)')
      .eq('id', treatment_plan_id)
      .single()

    // Calculate amounts (use insurance company coverage or default)
    const sessionCost = 200 // Default, should come from config
    const totalAmount = requested_sessions * sessionCost
    const coveragePercentage = insuranceCompany?.coverage_percentage || 80
    const coveredAmount = totalAmount * (coveragePercentage / 100)
    const patientResponsibility = totalAmount - coveredAmount

    // Generate claim number
    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Use AI to generate claim details based on learning
    const aiSuggestions = await generateAIClaimSuggestions(
      insuranceCompany?.id || null,
      patient_id,
      treatmentPlan,
      doctor_notes,
      medical_justification
    )

    // Create claim
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('insurance_claims_enhanced')
      .insert({
        claim_number: claimNumber,
        patient_id,
        doctor_id: user.id,
        insurance_company_id: insuranceCompany?.id || null,
        treatment_plan_id,
        claim_type: 'treatment_plan_sessions',
        requested_sessions: requested_sessions,
        session_dates: session_dates || [],
        total_amount: totalAmount,
        covered_amount: coveredAmount,
        patient_responsibility: patientResponsibility,
        doctor_notes: doctor_notes || null,
        medical_justification: medical_justification || null,
        auto_generated: true,
        ai_suggestions: aiSuggestions,
        status: 'draft',
        workflow_step: 'initial',
        metadata: {
          insurance_provider: insuranceInfo.insurance_provider,
          policy_number: insuranceInfo.policy_number,
          member_id: insuranceInfo.member_id
        }
      })
      .select()
      .single()

    if (claimError) throw claimError

    // Start automation workflow
    await startClaimAutomationWorkflow(claim.id)

    return NextResponse.json({
      success: true,
      data: claim,
      message: 'تم إنشاء المطالبة تلقائياً وبدء عملية الأتمتة'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/insurance/claims/auto-generate' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Generate AI suggestions for claim based on learning
 */
async function generateAIClaimSuggestions(
  insuranceCompanyId: string | null,
  patientId: string,
  treatmentPlan: any,
  doctorNotes: string | null,
  medicalJustification: string | null
): Promise<Record<string, unknown>> {
  // Get learning data for this insurance company
  if (insuranceCompanyId) {
    const { data: learningData } = await supabaseAdmin
      .from('ai_learning_logs')
      .select('*')
      .eq('entity_type', 'insurance_company')
      .eq('entity_id', insuranceCompanyId)
      .eq('applied_to_future_cases', true)
      .order('created_at', { ascending: false })
      .limit(10)

    // Analyze patterns
    const rejectionPatterns: string[] = []
    const requiredFields: string[] = []
    const commonIssues: string[] = []

    learningData?.forEach((log: Record<string, unknown>) => {
      if (log.learning_type === 'claim_rejection') {
        const pattern = log.pattern_detected as Record<string, unknown> | undefined
        if (pattern && typeof pattern.rejection_reason === 'string') {
          rejectionPatterns.push(pattern.rejection_reason)
        }
        if (pattern && Array.isArray(pattern.missing_fields)) {
          requiredFields.push(...(pattern.missing_fields as string[]))
        }
      }
    })

    return {
      rejection_patterns: [...new Set(rejectionPatterns)],
      required_fields: [...new Set(requiredFields)],
      common_issues: [...new Set(commonIssues)],
      suggestions: [
        'تأكد من تضمين جميع المعلومات المطلوبة',
        'راجع أسباب الرفض السابقة لتجنبها',
        'تأكد من صحة كود التشخيص'
      ]
    }
  }

  return {
    suggestions: ['تأكد من اكتمال جميع المعلومات المطلوبة']
  }
}

/**
 * Start automation workflow for claim
 */
async function startClaimAutomationWorkflow(claimId: string) {
  // 1. Validate claim completeness
  const { data: claim } = await supabaseAdmin
    .from('insurance_claims_enhanced')
    .select('*')
    .eq('id', claimId)
    .single()

  if (!claim) return

  // 2. Check if claim needs doctor review
  const needsReview = !claim.medical_justification || !claim.doctor_notes

  if (needsReview) {
    await supabaseAdmin
      .from('insurance_claims_enhanced')
      .update({
        requires_doctor_review: true,
        workflow_step: 'awaiting_doctor_review'
      })
      .eq('id', claimId)

    // Notify doctor
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      const template = NotificationTemplates.systemAlert(
        'يحتاج مطالبة التأمين لمراجعتك قبل الإرسال'
      )
      await createNotification({
        userId: claim.doctor_id,
        ...template,
        entityType: 'insurance_claim',
        entityId: claimId
      })
    } catch (e) {
      console.error('Failed to notify doctor:', e)
    }
    return
  }

  // 3. Auto-submit if complete
  await supabaseAdmin
    .from('insurance_claims_enhanced')
    .update({
      status: 'pending',
      workflow_step: 'ready_for_submission'
    })
    .eq('id', claimId)

  // 4. Send WhatsApp notifications
  await sendClaimWhatsAppNotifications(claimId)

  // 5. Submit claim (if auto-submit enabled)
  const { data: config } = await supabaseAdmin
    .from('system_configurations')
    .select('value')
    .eq('category', 'insurance')
    .eq('key', 'auto_submit_claims')
    .single()

  if (config?.value?.enabled) {
    await submitClaimToInsurance(claimId)
  }
}

/**
 * Send WhatsApp notifications for claim
 */
async function sendClaimWhatsAppNotifications(claimId: string) {
  const { data: claim } = await supabaseAdmin
    .from('insurance_claims_enhanced')
    .select(`
      *,
      patients (*)
    `)
    .eq('id', claimId)
    .single()

  if (!claim) return

  const patient = claim.patients
  if (!patient?.phone) return

  // Send to patient
  const messageText = `مرحباً ${patient.name}،

تم إنشاء مطالبة تأمين جديدة لك:
- رقم المطالبة: ${claim.claim_number}
- عدد الجلسات: ${claim.requested_sessions}
- المبلغ الإجمالي: ${claim.total_amount} ريال
- المبلغ المغطى: ${claim.covered_amount} ريال

سيتم إرسال المطالبة لشركة التأمين قريباً.

شكراً لثقتك بمركز الهمم.`

  try {
    const { sendTextMessage } = await import('@/lib/whatsapp')
    await sendTextMessage(patient.phone, messageText)

    // Save message record
    await supabaseAdmin
      .from('claim_whatsapp_messages')
      .insert({
        claim_id: claimId,
        recipient_type: 'patient',
        recipient_phone: patient.phone,
        message_type: 'claim_created',
        message_text: messageText,
        sent_at: new Date().toISOString()
      })
  } catch (e) {
    console.error('Failed to send WhatsApp message:', e)
  }
}

/**
 * Submit claim to insurance (placeholder - integrate with insurance API)
 */
async function submitClaimToInsurance(claimId: string) {
  // This would integrate with insurance company API
  // For now, just update status
  await supabaseAdmin
    .from('insurance_claims_enhanced')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      workflow_step: 'submitted'
    })
    .eq('id', claimId)
}

