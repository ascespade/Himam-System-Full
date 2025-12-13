/**
 * AI Insurance Agent API
 * Automated insurance claims management with learning capabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { askAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

interface ClaimSubmission {
  patient_id: string
  claim_type: string
  service_date: string
  service_description: string
  amount: number
  insurance_provider?: string
}

interface LearningPattern {
  insurance_provider: string
  claim_type: string
  common_errors: string[]
  required_fields: string[]
  success_patterns: string[]
  rejection_reasons: string[]
}

/**
 * GET /api/doctor/insurance/ai-agent
 * Get AI agent status and learning patterns
 */
export async function GET(req: NextRequest) {
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

    // Get learning patterns from database
    const { data: patterns, error: patternsError } = await supabaseAdmin
      .from('insurance_learning_patterns')
      .select('*')
      .order('updated_at', { ascending: false })

    // Get pending claims that need attention
    const { data: pendingClaims } = await supabaseAdmin
      .from('insurance_claims')
      .select('*, patients (name)')
      .in('status', ['pending', 'rejected', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(10)

    // Get statistics
    const { count: totalClaims } = await supabaseAdmin
      .from('insurance_claims')
      .select('*', { count: 'exact', head: true })

    const { count: approvedClaims } = await supabaseAdmin
      .from('insurance_claims')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'paid'])

    const { count: rejectedClaims } = await supabaseAdmin
      .from('insurance_claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')

    return NextResponse.json({
      success: true,
      data: {
        patterns: patterns || [],
        pendingClaims: pendingClaims || [],
        statistics: {
          total: totalClaims || 0,
          approved: approvedClaims || 0,
          rejected: rejectedClaims || 0,
          approvalRate: totalClaims ? ((approvedClaims || 0) / totalClaims * 100).toFixed(1) : '0'
        }
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/insurance/ai-agent' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/insurance/ai-agent/submit
 * AI-powered automated claim submission with validation
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

    const body: ClaimSubmission = await req.json()
    const { patient_id, claim_type, service_date, service_description, amount, insurance_provider } = body

    // Step 1: Get patient insurance info
    const { data: patientInsurance } = await supabaseAdmin
      .from('patient_insurance')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('is_active', true)
      .single()

    if (!patientInsurance) {
      return NextResponse.json({
        success: false,
        error: 'لا توجد معلومات تأمين نشطة للمريض',
        requiresHumanReview: true
      }, { status: 400 })
    }

    // Step 2: Get learning patterns for this insurance provider and claim type
    const { data: pattern } = await supabaseAdmin
      .from('insurance_learning_patterns')
      .select('*')
      .eq('insurance_provider', patientInsurance.insurance_company || insurance_provider)
      .eq('claim_type', claim_type)
      .single()

    // Step 3: Vector Similarity Check - Find similar rejected claims (before validation)
    let vectorAnalysis: Record<string, unknown> | null = null
    try {
      const similarityRes = await fetch(`${req.nextUrl.origin}/api/doctor/insurance/ai-agent/embeddings/check-similarity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          claim_description: service_description, // Use initial description first
          insurance_provider: patientInsurance.insurance_company || insurance_provider,
          claim_type: claim_type
        })
      })

      if (similarityRes.ok) {
        vectorAnalysis = await similarityRes.json()
      }
    } catch (e) {
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('Vector similarity check failed, continuing with regular validation', { error: e, patient_id, endpoint: '/api/doctor/insurance/ai-agent' })
    }

    // Step 4: AI Validation using learned patterns + vector analysis
    const validationPrompt = `
أنت مساعد ذكي لإدارة مطالبات التأمين. قم بتحليل المطالبة التالية:

المريض: ${patient_id}
نوع المطالبة: ${claim_type}
تاريخ الخدمة: ${service_date}
الوصف: ${service_description}
المبلغ: ${amount} ريال
شركة التأمين: ${patientInsurance.insurance_company || insurance_provider}

${pattern ? `
أنماط التعلم السابقة:
- الأخطاء الشائعة: ${pattern.common_errors?.join(', ') || 'لا توجد'}
- الحقول المطلوبة: ${pattern.required_fields?.join(', ') || 'لا توجد'}
- أسباب الرفض السابقة: ${pattern.rejection_reasons?.join(', ') || 'لا توجد'}
` : ''}

${(() => {
  if (!vectorAnalysis?.data || typeof vectorAnalysis.data !== 'object') return ''
  const data = vectorAnalysis.data as Record<string, unknown>
  const warnings = Array.isArray(data.warnings) ? data.warnings as string[] : []
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations as string[] : []
  const similarRejectedCount = typeof data.similar_rejected_count === 'number' ? data.similar_rejected_count : 0
  
  let result = ''
  if (warnings.length > 0) {
    result += `\n⚠️ تحذيرات من نظام الفيكتورز:\n${warnings.map((w: string) => `- ${w}`).join('\n')}\n`
  }
  if (recommendations.length > 0) {
    result += `\n💡 توصيات من نظام الفيكتورز:\n${recommendations.map((r: string) => `- ${r}`).join('\n')}\n`
  }
  if (similarRejectedCount > 0) {
    result += `\nتم العثور على ${similarRejectedCount} مطالبات مرفوضة مشابهة.\n`
  }
  return result
})()}

قم بتحليل المطالبة وأخبرني:
1. هل جميع البيانات مكتملة؟
2. ما هي الحقول الناقصة إن وجدت؟
3. هل هناك أي أخطاء محتملة بناءً على الأنماط السابقة والفيكتورز؟
4. ما هي التوصيات لضمان الموافقة مع الأخذ بعين الاعتبار المطالبات المشابهة المرفوضة؟

أجب بصيغة JSON:
{
  "isValid": true/false,
  "missingFields": ["field1", "field2"],
  "potentialErrors": ["error1", "error2"],
  "recommendations": ["rec1", "rec2"],
  "requiresHumanReview": true/false,
  "confidence": 0-100
}
`

    const aiValidation = await askAI(validationPrompt)
    let validationResult: any = { isValid: true, missingFields: [], potentialErrors: [], recommendations: [], requiresHumanReview: false, confidence: 100 }

    try {
      // Try to parse AI response as JSON
      const jsonMatch = aiValidation.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('Could not parse AI validation response, using defaults', { error: e, patient_id, endpoint: '/api/doctor/insurance/ai-agent' })
    }

    // Merge vector analysis with AI validation
    if (vectorAnalysis?.data && typeof vectorAnalysis.data === 'object') {
      const data = vectorAnalysis.data as Record<string, unknown>
      const warnings = Array.isArray(data.warnings) ? data.warnings as string[] : []
      const recommendations = Array.isArray(data.recommendations) ? data.recommendations as string[] : []
      
      if (warnings.length > 0) {
        validationResult.potentialErrors = [
          ...validationResult.potentialErrors,
          ...warnings
        ]
      }
      if (recommendations.length > 0) {
        validationResult.recommendations = [
          ...validationResult.recommendations,
          ...recommendations
        ]
      }
      const requiresHumanReview = typeof data.requiresHumanReview === 'boolean' ? data.requiresHumanReview : false
      if (requiresHumanReview) {
        validationResult.requiresHumanReview = true
        validationResult.confidence = Math.min(validationResult.confidence || 100, 70)
      }
    }

    // Step 4: Check if human review is required
    if (validationResult.requiresHumanReview || validationResult.confidence < 70) {
      // Create notification for doctor
      try {
        const { createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
        await createNotificationForRole('doctor', {
          title: 'مطالبة تأمين تحتاج مراجعة',
          message: `المطالبة تحتاج مراجعة يدوية. الثقة: ${validationResult.confidence}%`,
          type: 'payment' as const, // Use existing notification type
          entityType: 'insurance_claim',
          entityId: 'pending'
        })
      } catch (e) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Failed to create notification', e, { claimId: patient_id, endpoint: '/api/doctor/insurance/ai-agent' })
      }

      return NextResponse.json({
        success: false,
        error: 'المطالبة تحتاج مراجعة يدوية',
        validation: validationResult,
        requiresHumanReview: true
      }, { status: 400 })
    }

    // Step 5: Auto-fix missing fields if possible
    let finalDescription = service_description
    if (validationResult.missingFields?.length > 0) {
      const fixPrompt = `
قم بتحسين وصف الخدمة التالي لإضافة المعلومات الناقصة:
${service_description}

الحقول الناقصة: ${validationResult.missingFields.join(', ')}

قم بكتابة وصف محسّن ومكتمل:
`
      const aiFix = await askAI(fixPrompt)
      if (aiFix.text) {
        finalDescription = aiFix.text
      }
    }

    // Step 6: Create claim
    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // Calculate coverage based on insurance plan
    const coveragePercentage = patientInsurance.coverage_percentage || 80
    const coveredAmount = amount * (coveragePercentage / 100)
    const patientResponsibility = amount - coveredAmount

    const { data: claim, error: claimError } = await supabaseAdmin
      .from('insurance_claims')
      .insert({
        patient_id,
        claim_number: claimNumber,
        claim_type,
        service_date,
        service_description: finalDescription,
        amount,
        covered_amount: coveredAmount,
        patient_responsibility: patientResponsibility,
        insurance_provider: patientInsurance.insurance_company || insurance_provider,
        status: 'submitted',
        submitted_date: new Date().toISOString(),
        submitted_by_ai: true,
        ai_confidence: validationResult.confidence
      })
      .select()
      .single()

    if (claimError) throw claimError

    // Step 7: Store vector embeddings for future learning
    try {
      await fetch(`${req.nextUrl.origin}/api/doctor/insurance/ai-agent/embeddings/store`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          claim_id: claim.id,
          claim_description: finalDescription,
          insurance_provider: patientInsurance.insurance_company || insurance_provider,
          claim_type: claim_type,
          outcome: 'submitted',
          claim_metadata: {
            amount,
            service_date,
            patient_id
          }
        })
      })
    } catch (e) {
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('Failed to store embeddings, continuing', { error: e, patient_id, endpoint: '/api/doctor/insurance/ai-agent' })
    }

    // Step 8: Auto-submit if confidence is high
    if (validationResult.confidence >= 90) {
      // Claim is auto-submitted, create success notification
      try {
        const { createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
        await createNotificationForRole('doctor', {
          title: 'تم إرسال مطالبة تأمين تلقائياً',
          message: `تم إرسال المطالبة ${claimNumber} بنجاح`,
          type: 'insurance_claim_submitted',
          entityType: 'insurance_claim',
          entityId: claim.id
        })
      } catch (e) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Failed to create notification', e, { claimId: patient_id, endpoint: '/api/doctor/insurance/ai-agent' })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        claim,
        validation: validationResult,
        autoSubmitted: validationResult.confidence >= 90
      }
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/insurance/ai-agent' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/doctor/insurance/ai-agent/learn
 * Learn from claim outcome (approval/rejection)
 */
export async function PUT(req: NextRequest) {
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
    const { claim_id, outcome, rejection_reason, approved_amount } = body

    if (!claim_id || !outcome) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get claim details
    const { data: claim } = await supabaseAdmin
      .from('insurance_claims')
      .select('*')
      .eq('id', claim_id)
      .single()

    if (!claim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Get or create learning pattern
    const { data: existingPattern } = await supabaseAdmin
      .from('insurance_learning_patterns')
      .select('*')
      .eq('insurance_provider', claim.insurance_provider || '')
      .eq('claim_type', claim.claim_type)
      .single()

    const patternUpdates: Record<string, unknown> = {
      insurance_provider: claim.insurance_provider || '',
      claim_type: claim.claim_type,
      updated_at: new Date().toISOString()
    }

    // Update embeddings with outcome
    try {
      await fetch(`${req.nextUrl.origin}/api/doctor/insurance/ai-agent/embeddings/store`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          claim_id: claim.id,
          claim_description: claim.service_description || '',
          insurance_provider: claim.insurance_provider || '',
          claim_type: claim.claim_type,
          outcome: outcome,
          rejection_reason: rejection_reason || null,
          error_patterns: body.error_patterns || [],
          claim_metadata: {
            amount: claim.amount,
            service_date: claim.service_date,
            patient_id: claim.patient_id
          }
        })
      })
    } catch (e) {
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('Failed to update embeddings with outcome', { error: e, patient_id: claim.patient_id, outcome, endpoint: '/api/doctor/insurance/ai-agent' })
    }

    if (outcome === 'approved') {
      // Learn from success
      patternUpdates.success_count = (existingPattern?.success_count || 0) + 1
      if (existingPattern?.success_patterns) {
        patternUpdates.success_patterns = [
          ...existingPattern.success_patterns,
          `Approved with description: ${claim.service_description?.substring(0, 100)}`
        ].slice(-10) // Keep last 10
      } else {
        patternUpdates.success_patterns = [`Approved: ${claim.service_description?.substring(0, 100)}`]
      }
    } else if (outcome === 'rejected') {
      // Learn from rejection
      patternUpdates.rejection_count = (existingPattern?.rejection_count || 0) + 1
      if (rejection_reason) {
        if (existingPattern?.rejection_reasons) {
          patternUpdates.rejection_reasons = [
            ...existingPattern.rejection_reasons,
            rejection_reason
          ].slice(-20) // Keep last 20
        } else {
          patternUpdates.rejection_reasons = [rejection_reason]
        }
      }
      
      // Analyze common errors
      const errorAnalysis = await askAI(`
حلل سبب رفض المطالبة التالية وحدد الأخطاء الشائعة:

المطالبة:
- النوع: ${claim.claim_type}
- الوصف: ${claim.service_description}
- المبلغ: ${claim.amount}
- سبب الرفض: ${rejection_reason}

ما هي الأخطاء التي أدت للرفض؟ وما هي الحقول الناقصة؟
أجب بقائمة JSON: ["error1", "error2"]
`)
      
      try {
        const errorsMatch = errorAnalysis.text.match(/\[[\s\S]*\]/)
        if (errorsMatch) {
          const errors = JSON.parse(errorsMatch[0])
          if (existingPattern?.common_errors) {
            patternUpdates.common_errors = [...existingPattern.common_errors, ...errors].slice(-20)
          } else {
            patternUpdates.common_errors = errors
          }
        }
      } catch (e) {
        const { logWarn } = await import('@/shared/utils/logger')
        logWarn('Could not parse error analysis', { error: e, patient_id: claim.patient_id, endpoint: '/api/doctor/insurance/ai-agent' })
      }
    }

    // Upsert pattern
    if (existingPattern) {
      await supabaseAdmin
        .from('insurance_learning_patterns')
        .update(patternUpdates)
        .eq('id', existingPattern.id)
    } else {
      await supabaseAdmin
        .from('insurance_learning_patterns')
        .insert({
          ...patternUpdates,
          success_count: outcome === 'approved' ? 1 : 0,
          rejection_count: outcome === 'rejected' ? 1 : 0
        })
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث أنماط التعلم بنجاح'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/insurance/ai-agent' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

