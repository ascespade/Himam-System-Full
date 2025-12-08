/**
 * POST /api/doctor/insurance/claims/auto-submit
 * Auto-submit insurance claim using AI Agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

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
    const { claim_id } = body

    if (!claim_id) {
      return NextResponse.json(
        { success: false, error: 'Claim ID is required' },
        { status: 400 }
      )
    }

    // Use AI Agent to submit claim
    const aiAgentRes = await fetch(`${req.nextUrl.origin}/api/doctor/insurance/ai-agent/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        patient_id: body.patient_id,
        claim_type: body.claim_type,
        service_date: body.service_date,
        service_description: body.service_description,
        amount: body.amount,
        insurance_provider: body.insurance_provider
      })
    })

    const aiAgentData = await aiAgentRes.json()

    if (!aiAgentData.success) {
      return NextResponse.json({
        success: false,
        error: aiAgentData.error || 'فشل الإرسال التلقائي',
        requiresHumanReview: aiAgentData.requiresHumanReview || false,
        validation: aiAgentData.validation
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: aiAgentData.data,
      message: aiAgentData.data.autoSubmitted 
        ? 'تم إرسال المطالبة تلقائياً بنجاح' 
        : 'تم إنشاء المطالبة، تحتاج مراجعة قبل الإرسال'
    })
  } catch (error: any) {
    console.error('Error in auto-submit:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

