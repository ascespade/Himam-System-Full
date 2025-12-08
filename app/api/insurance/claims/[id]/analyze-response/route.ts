import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/insurance/claims/[id]/analyze-response
 * Analyze insurance company response using AI
 * يحلل رد شركة التأمين ويحدد الإجراء المطلوب
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { response_text } = body

    if (!response_text) {
      return NextResponse.json(
        { success: false, error: 'Response text is required' },
        { status: 400 }
      )
    }

    // Get claim details
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('insurance_claims_enhanced')
      .select(`
        *,
        insurance_companies (*),
        patients (*)
      `)
      .eq('id', params.id)
      .single()

    if (claimError || !claim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Analyze response using AI
    const analysis = await analyzeInsuranceResponse(
      response_text,
      claim,
      claim.insurance_companies
    )

    // Update claim with analysis
    await supabaseAdmin
      .from('insurance_claims_enhanced')
      .update({
        response_received_at: new Date().toISOString(),
        response_text: response_text,
        response_analyzed_by_ai: true,
        ai_analysis_result: analysis,
        workflow_step: analysis.next_step || 'awaiting_action'
      })
      .eq('id', params.id)

    // Learn from this response
    await learnFromResponse(claim, analysis)

    // Take action based on analysis
    if (analysis.action === 'approve') {
      await handleApproval(params.id, analysis)
    } else if (analysis.action === 'reject') {
      await handleRejection(params.id, analysis)
    } else if (analysis.action === 'request_info') {
      await handleInfoRequest(params.id, analysis)
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        claim_id: params.id
      }
    })
  } catch (error: any) {
    console.error('Error analyzing response:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Analyze insurance response using AI
 */
async function analyzeInsuranceResponse(
  responseText: string,
  claim: any,
  insuranceCompany: any
): Promise<any> {
  // Get AI API key
  const aiApiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!aiApiKey) {
    // Fallback analysis
    return {
      action: 'unknown',
      confidence: 50,
      reasoning: 'AI service not configured',
      next_step: 'manual_review'
    }
  }

  // Get learning data for this insurance company
  const { data: learningData } = await supabaseAdmin
    .from('ai_learning_logs')
    .select('*')
    .eq('entity_type', 'insurance_company')
    .eq('entity_id', insuranceCompany?.id || '')
    .order('created_at', { ascending: false })
    .limit(20)

  const learningContext = learningData?.map((log: any) => log.lesson_learned).join('\n') || ''

  // Build prompt
  const prompt = `أنت مساعد ذكي لتحليل ردود شركات التأمين الصحي.

السياق:
- رقم المطالبة: ${claim.claim_number}
- شركة التأمين: ${insuranceCompany?.name || 'غير معروف'}
- نوع المطالبة: ${claim.claim_type}
- عدد الجلسات: ${claim.requested_sessions}

التعلم من الماضي:
${learningContext}

رد شركة التأمين:
"${responseText}"

قم بتحليل الرد وتحديد:
1. الإجراء: 'approve' (موافقة), 'reject' (رفض), 'request_info' (طلب معلومات), 'partial_approve' (موافقة جزئية)
2. مستوى الثقة: 0-100
3. السبب/التفاصيل
4. المعلومات الناقصة (إن وجدت)
5. الخطوة التالية المطلوبة
6. هل يحتاج تدخل الطبيب أو مسؤول التأمين؟

أجب بصيغة JSON فقط:
{
  "action": "approve|reject|request_info|partial_approve|unknown",
  "confidence": 85,
  "reasoning": "سبب التحليل",
  "details": "تفاصيل إضافية",
  "missing_info": ["المعلومات الناقصة"],
  "next_step": "الخطوة التالية",
  "requires_doctor_review": false,
  "requires_insurance_officer_review": false,
  "suggested_response": "الرد المقترح"
}`

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد ذكي لتحليل ردود شركات التأمين. أجب دائماً بصيغة JSON فقط.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    const data = await aiResponse.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    
    // Parse JSON response
    const analysis = JSON.parse(content)
    
    return {
      ...analysis,
      analyzed_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    // Fallback: simple keyword-based analysis
    return analyzeByKeywords(responseText)
  }
}

/**
 * Fallback: Analyze by keywords
 */
function analyzeByKeywords(responseText: string): any {
  const text = responseText.toLowerCase()
  
  if (text.includes('موافق') || text.includes('approved') || text.includes('مقبول')) {
    return {
      action: 'approve',
      confidence: 70,
      reasoning: 'الكلمات الإيجابية تشير للموافقة',
      next_step: 'process_approval'
    }
  }
  
  if (text.includes('مرفوض') || text.includes('rejected') || text.includes('رفض')) {
    return {
      action: 'reject',
      confidence: 70,
      reasoning: 'الكلمات السلبية تشير للرفض',
      next_step: 'handle_rejection',
      requires_doctor_review: true
    }
  }
  
  if (text.includes('معلومات') || text.includes('information') || text.includes('ناقص')) {
    return {
      action: 'request_info',
      confidence: 65,
      reasoning: 'طلب معلومات إضافية',
      next_step: 'gather_missing_info',
      requires_insurance_officer_review: true
    }
  }
  
  return {
    action: 'unknown',
    confidence: 50,
    reasoning: 'لا يمكن تحديد الإجراء بدقة',
    next_step: 'manual_review',
    requires_insurance_officer_review: true
  }
}

/**
 * Learn from response
 */
async function learnFromResponse(claim: any, analysis: any) {
  if (!claim.insurance_company_id) return

  const learningData = {
    response_text: claim.response_text,
    analysis_result: analysis,
    claim_details: {
      claim_type: claim.claim_type,
      requested_sessions: claim.requested_sessions,
      total_amount: claim.total_amount
    }
  }

  const pattern = {
    action: analysis.action,
    rejection_reason: analysis.action === 'reject' ? analysis.reasoning : null,
    missing_fields: analysis.missing_info || [],
    common_issues: []
  }

  await supabaseAdmin
    .from('ai_learning_logs')
    .insert({
      entity_type: 'insurance_company',
      entity_id: claim.insurance_company_id,
      learning_type: analysis.action === 'approve' ? 'claim_approval' : 'claim_rejection',
      context: learningData,
      pattern_detected: pattern,
      lesson_learned: `شركة ${claim.insurance_companies?.name} ${analysis.action === 'approve' ? 'وافقت' : 'رفضت'} المطالبة بسبب: ${analysis.reasoning}`,
      confidence_score: analysis.confidence || 50,
      applied_to_future_cases: analysis.confidence > 70
    })
}

/**
 * Handle approval
 */
async function handleApproval(claimId: string, analysis: any) {
  await supabaseAdmin
    .from('insurance_claims_enhanced')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_amount: analysis.approved_amount || null
    })
    .eq('id', claimId)

  // Notify all parties
  await notifyClaimApproval(claimId)
}

/**
 * Handle rejection
 */
async function handleRejection(claimId: string, analysis: any) {
  await supabaseAdmin
    .from('insurance_claims_enhanced')
    .update({
      status: 'rejected',
      rejection_reason: analysis.reasoning,
      rejection_category: analysis.category || 'other',
      requires_doctor_review: analysis.requires_doctor_review || false,
      requires_insurance_officer_review: analysis.requires_insurance_officer_review || false
    })
    .eq('id', claimId)

  // Notify doctor if needed
  if (analysis.requires_doctor_review) {
    const { data: claim } = await supabaseAdmin
      .from('insurance_claims_enhanced')
      .select('doctor_id')
      .eq('id', claimId)
      .single()

    if (claim) {
      try {
        const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
        const template = NotificationTemplates.systemAlert(
          `تم رفض مطالبة التأمين. السبب: ${analysis.reasoning}`
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
    }
  }
}

/**
 * Handle info request
 */
async function handleInfoRequest(claimId: string, analysis: any) {
  await supabaseAdmin
    .from('insurance_claims_enhanced')
    .update({
      status: 'under_review',
      requires_insurance_officer_review: true,
      workflow_step: 'gathering_info'
    })
    .eq('id', claimId)

  // Try to auto-fill missing info if available
  if (analysis.missing_info && analysis.missing_info.length > 0) {
    await attemptAutoFillMissingInfo(claimId, analysis.missing_info)
  }
}

/**
 * Attempt to auto-fill missing information
 */
async function attemptAutoFillMissingInfo(claimId: string, missingInfo: string[]) {
  const { data: claim } = await supabaseAdmin
    .from('insurance_claims_enhanced')
    .select('*, patients(*), treatment_plans(*)')
    .eq('id', claimId)
    .single()

  if (!claim) return

  // This would use AI to extract missing info from patient records
  // For now, just mark for manual review
  console.log('Missing info detected:', missingInfo)
}

/**
 * Notify claim approval
 */
async function notifyClaimApproval(claimId: string) {
  const { data: claim } = await supabaseAdmin
    .from('insurance_claims_enhanced')
    .select('*, patients(*)')
    .eq('id', claimId)
    .single()

  if (!claim) return

  // Notify patient via WhatsApp
  if (claim.patients?.phone) {
    const message = `مرحباً ${claim.patients.name}،

تمت الموافقة على مطالبة التأمين الخاصة بك:
- رقم المطالبة: ${claim.claim_number}
- المبلغ المعتمد: ${claim.approved_amount || claim.covered_amount} ريال

شكراً لثقتك بمركز الهمم.`

    try {
      const { sendTextMessage } = await import('@/lib/whatsapp')
      await sendTextMessage(claim.patients.phone, message)
    } catch (e) {
      console.error('Failed to send WhatsApp:', e)
    }
  }
}

