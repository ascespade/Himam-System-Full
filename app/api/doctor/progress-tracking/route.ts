/**
 * Patient Progress Tracking API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/progress-tracking
 * Get progress tracking entries for a patient
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patient_id')
    const treatmentPlanId = searchParams.get('treatment_plan_id')
    const progressType = searchParams.get('progress_type')

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from('patient_progress_tracking')
      .select(`
        id, patient_id, doctor_id, treatment_plan_id, session_id, progress_type, progress_value, notes, created_at, updated_at,
        patients (id, name),
        treatment_plans (id, title),
        sessions (id, date, session_type)
      `)
      .eq('patient_id', patientId)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false })

    if (treatmentPlanId) {
      query = query.eq('treatment_plan_id', treatmentPlanId)
    }

    if (progressType) {
      query = query.eq('progress_type', progressType)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/progress-tracking' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/doctor/progress-tracking
 * Create a new progress tracking entry
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
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
      patient_id,
      treatment_plan_id,
      session_id,
      progress_type,
      title,
      description,
      progress_value,
      progress_level,
      attachments,
    } = body

    if (!patient_id || !progress_type || !title) {
      return NextResponse.json(
        { success: false, error: 'Patient ID, progress type, and title are required' },
        { status: 400 }
      )
    }

    // Verify patient belongs to doctor
    const { data: relationship } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select('id')
      .eq('doctor_id', user.id)
      .eq('patient_id', patient_id)
      .is('end_date', null)
      .single()

    if (!relationship) {
      return NextResponse.json(
        { success: false, error: 'Patient not assigned to this doctor' },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('patient_progress_tracking')
      .insert({
        patient_id,
        doctor_id: user.id,
        treatment_plan_id: treatment_plan_id || null,
        session_id: session_id || null,
        progress_type,
        title,
        description: description || null,
        progress_value: progress_value || null,
        progress_level: progress_level || null,
        attachments: attachments || [],
        created_by: user.id,
      })
      .select(`
        *,
        patients (id, name),
        treatment_plans (id, title),
        sessions (id, date, session_type)
      `)
      .single()

    if (error) throw error

    // Create notification
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      await createNotification({
        userId: user.id,
        patientId: patient_id,
        ...NotificationTemplates.systemAlert(
          `تم تسجيل تقدم جديد: ${title}`
        ),
        title: 'تقدم جديد',
        entityType: 'progress_tracking',
        entityId: data.id,
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to create notification', e, { progressId: data.id, endpoint: '/api/doctor/progress-tracking' })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/progress-tracking' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

