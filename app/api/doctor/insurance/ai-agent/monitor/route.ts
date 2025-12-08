/**
 * Insurance Claims Monitoring API
 * Automated monitoring and follow-up for insurance claims
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { askAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/insurance/ai-agent/monitor
 * Get claims that need attention or follow-up
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

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get claims that need follow-up
    const { data: claimsNeedingFollowUp } = await supabaseAdmin
      .from('insurance_claims')
      .select(`
        *,
        patients (name, phone)
      `)
      .in('status', ['submitted', 'under_review'])
      .lte('submitted_date', sevenDaysAgo.toISOString())
      .order('submitted_date', { ascending: true })

    // Get rejected claims that need resubmission
    const { data: rejectedClaims } = await supabaseAdmin
      .from('insurance_claims')
      .select(`
        *,
        patients (name, phone)
      `)
      .eq('status', 'rejected')
      .is('resubmission_notes', null)
      .order('processed_date', { ascending: false })

    // Get claims with special cases (low confidence, multiple rejections, etc.)
    const { data: specialCases } = await supabaseAdmin
      .from('insurance_claims')
      .select(`
        *,
        patients (name, phone)
      `)
      .or('ai_confidence.lt.70,rejection_count.gt.2')
      .in('status', ['pending', 'rejected'])
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      data: {
        needsFollowUp: claimsNeedingFollowUp || [],
        needsResubmission: rejectedClaims || [],
        specialCases: specialCases || [],
        summary: {
          totalNeedingAttention: (claimsNeedingFollowUp?.length || 0) + (rejectedClaims?.length || 0) + (specialCases?.length || 0),
          followUpCount: claimsNeedingFollowUp?.length || 0,
          resubmissionCount: rejectedClaims?.length || 0,
          specialCasesCount: specialCases?.length || 0
        }
      }
    })
  } catch (error: any) {
    console.error('Error in monitoring:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/insurance/ai-agent/monitor/auto-followup
 * Automated follow-up on pending claims
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
          remove(name: string, value: string, options: CookieOptions) {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { claim_id, action } = body

    if (!claim_id) {
      return NextResponse.json(
        { success: false, error: 'Claim ID is required' },
        { status: 400 }
      )
    }

    // Get claim
    const { data: claim } = await supabaseAdmin
      .from('insurance_claims')
      .select('*, patients (name, phone)')
      .eq('id', claim_id)
      .single()

    if (!claim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { status: 404 }
      )
    }

    if (action === 'resubmit') {
      // AI-powered resubmission with improvements
      const improvementPrompt = `
المطالبة التالية تم رفضها. قم بتحليلها وتحسينها:

المطالبة الأصلية:
- النوع: ${claim.claim_type}
- الوصف: ${claim.service_description}
- المبلغ: ${claim.amount}
- سبب الرفض: ${claim.rejection_reason || 'غير محدد'}

قم بتحسين الوصف وإضافة المعلومات الناقصة لضمان الموافقة:
`

      const aiImprovement = await askAI(improvementPrompt)
      const improvedDescription = aiImprovement.text || claim.service_description

      // Update claim with improved description
      const { data: updatedClaim, error: updateError } = await supabaseAdmin
        .from('insurance_claims')
        .update({
          service_description: improvedDescription,
          status: 'submitted',
          submitted_date: new Date().toISOString(),
          resubmission_notes: 'تمت إعادة الإرسال تلقائياً مع تحسينات',
          rejection_count: (claim.rejection_count || 0) + 1
        })
        .eq('id', claim_id)
        .select()
        .single()

      if (updateError) throw updateError

      // Notify doctor
      try {
        const { createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
        await createNotificationForRole('doctor', {
          title: 'تمت إعادة إرسال مطالبة تلقائياً',
          message: `تمت إعادة إرسال المطالبة ${claim.claim_number} مع تحسينات`,
          type: 'insurance_claim_resubmitted',
          entityType: 'insurance_claim',
          entityId: claim_id
        })
      } catch (e) {
        console.error('Failed to create notification:', e)
      }

      return NextResponse.json({
        success: true,
        data: updatedClaim,
        message: 'تمت إعادة إرسال المطالبة مع التحسينات'
      })
    } else if (action === 'escalate') {
      // Escalate to human review
      try {
        const { createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
        await createNotificationForRole('doctor', {
          title: 'مطالبة تأمين تحتاج مراجعة عاجلة',
          message: `المطالبة ${claim.claim_number} تحتاج مراجعة يدوية`,
          type: 'insurance_claim_escalation',
          entityType: 'insurance_claim',
          entityId: claim_id,
          priority: 'high'
        })

        await createNotificationForRole('admin', {
          title: 'مطالبة تأمين تحتاج مراجعة',
          message: `المطالبة ${claim.claim_number} تم تصعيدها للمراجعة`,
          type: 'insurance_claim_escalation',
          entityType: 'insurance_claim',
          entityId: claim_id,
          priority: 'high'
        })
      } catch (e) {
        console.error('Failed to create notifications:', e)
      }

      return NextResponse.json({
        success: true,
        message: 'تم تصعيد المطالبة للمراجعة'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in auto-followup:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

