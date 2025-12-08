import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/sessions
 * Get doctor's therapy sessions
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

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('sessions')
      .select(`
        *,
        patients (
          name,
          phone
        ),
        video_sessions (
          meeting_url,
          recording_url,
          recording_status
        )
      `)
      .eq('doctor_id', user.id)

    if (type && type !== 'all') {
      query = query.eq('session_type', type)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/sessions
 * Create new therapy session
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
    const { patient_id, appointment_id, date, duration, session_type, status, chief_complaint, assessment, plan, notes, diagnosis, treatment, insurance_claim_id } = body

    // Validate
    if (!patient_id || !date || !session_type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // ============================================
    // BUSINESS RULES: Session Data Validation
    // ============================================
    try {
      const { sessionValidationService } = await import('@/core/business-rules/session-validation')
      
      // Get patient insurance info
      const { data: insurance } = await supabaseAdmin
        .from('patient_insurance')
        .select('provider')
        .eq('patient_id', patient_id)
        .eq('is_active', true)
        .maybeSingle()

      const sessionData = {
        patient_id,
        doctor_id: user.id,
        session_type,
        service_type: body.service_type,
        chief_complaint,
        assessment,
        plan,
        notes,
        diagnosis,
        treatment,
        insurance_claim_id
      }

      const validation = await sessionValidationService.validateSessionData(
        sessionData,
        insurance?.provider
      )

      if (!validation.isValid || !validation.isComplete) {
        return NextResponse.json({
          success: false,
          error: 'بيانات الجلسة غير مكتملة',
          validation: {
            missingFields: validation.missingFields,
            warnings: validation.warnings,
            suggestions: validation.suggestions
          }
        }, { status: 400 })
      }

      // Log validation
      await supabaseAdmin
        .from('session_validation_logs')
        .insert({
          session_id: null, // Will be updated after session creation
          validation_type: 'ai_agent',
          is_valid: validation.isValid,
          is_complete: validation.isComplete,
          missing_fields: validation.missingFields,
          warnings: validation.warnings,
          suggestions: validation.suggestions,
          ai_confidence: validation.aiConfidence,
          validated_by: user.id
        })
        .catch(err => console.error('Failed to log validation:', err))
    } catch (error) {
      console.error('Session validation error:', error)
      // Continue if validation service fails (graceful degradation)
    }

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        doctor_id: user.id,
        patient_id,
        appointment_id: appointment_id || null,
        date,
        duration: duration || 30,
        session_type,
        status: status || 'scheduled',
        chief_complaint: chief_complaint || null,
        assessment: assessment || null,
        plan: plan || null,
        notes: notes || null,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        insurance_claim_id: insurance_claim_id || null
      })
      .select(`
        *,
        patients (
          name,
          phone
        )
      `)
      .single()

    if (error) throw error

    // Update validation log with session ID
    if (data.id) {
      await supabaseAdmin
        .from('session_validation_logs')
        .update({ session_id: data.id })
        .is('session_id', null)
        .eq('validated_by', user.id)
        .order('validated_at', { ascending: false })
        .limit(1)
        .catch(err => console.error('Failed to update validation log:', err))
    }

    // Learn from successful session creation (if insurance claim exists)
    if (insurance_claim_id) {
      try {
        const { templateLearningService } = await import('@/core/business-rules/template-learning')
        const { data: claim } = await supabaseAdmin
          .from('insurance_claims')
          .select('insurance_provider, service_type, status')
          .eq('id', insurance_claim_id)
          .single()

        if (claim && claim.status === 'approved') {
          await templateLearningService.learnFromSuccessfulClaim(
            insurance_claim_id,
            claim.insurance_provider,
            claim.service_type
          )
        }
      } catch (e) {
        console.error('Failed to learn from session:', e)
      }
    }

    // Create notification
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      const template = NotificationTemplates.systemAlert(
        `تم إنشاء جلسة ${session_type} للمريض ${data.patients?.name || 'مريض'}`
      )
      await createNotification({
        userId: user.id,
        ...template,
        title: 'جلسة جديدة',
        entityType: 'session',
        entityId: data.id
      })
    } catch (e) {
      console.error('Failed to create notification:', e)
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

