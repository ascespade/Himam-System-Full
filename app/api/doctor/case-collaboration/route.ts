/**
 * Case Collaboration API
 * Multi-doctor case collaboration system
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/case-collaboration
 * Get case collaborations for a doctor
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
    const status = searchParams.get('status')

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from('case_collaborations')
      .select(`
        id, patient_id, primary_doctor_id, collaborating_doctors, status, priority, description, created_at, updated_at,
        patients (id, name, phone),
        primary_doctor:primary_doctor_id (id, name),
        comments:case_collaboration_comments (
          id,
          comment_text,
          created_at,
          doctor:doctor_id (id, name)
        )
      `)
      .or(`primary_doctor_id.eq.${user.id},collaborating_doctors.cs.{${user.id}}`)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/case-collaboration' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/doctor/case-collaboration
 * Create a new case collaboration
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
      case_title,
      case_description,
      collaborating_doctors,
      priority,
      tags,
    } = body

    if (!patient_id || !case_title) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and case title are required' },
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
      .from('case_collaborations')
      .insert({
        patient_id,
        case_title,
        case_description: case_description || null,
        primary_doctor_id: user.id,
        collaborating_doctors: collaborating_doctors || [],
        priority: priority || 'normal',
        tags: tags || [],
        status: 'active',
      })
      .select(`
        *,
        patients (id, name, phone),
        primary_doctor:primary_doctor_id (id, name)
      `)
      .single()

    if (error) throw error

    // Notify collaborating doctors
    if (collaborating_doctors && collaborating_doctors.length > 0) {
      try {
        const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
        for (const doctorId of collaborating_doctors) {
          await createNotification({
            userId: doctorId,
            ...NotificationTemplates.systemAlert(
              `تمت دعوتك للتعاون في حالة: ${case_title}`
            ),
            title: 'دعوة للتعاون',
            entityType: 'case_collaboration',
            entityId: data.id,
          })
        }
      } catch (e) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Failed to notify collaborating doctors', e, { caseId: data.id, endpoint: '/api/doctor/case-collaboration' })
      }
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/case-collaboration' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

