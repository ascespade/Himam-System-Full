/**
 * Case Collaboration Comments API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/case-collaboration/[id]/comments
 * Get comments for a case
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const caseId = params.id

    // Verify access to case
    const { data: caseData } = await supabaseAdmin
      .from('case_collaborations')
      .select('primary_doctor_id, collaborating_doctors')
      .eq('id', caseId)
      .single()

    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 })
    }

    const hasAccess =
      caseData.primary_doctor_id === user.id ||
      caseData.collaborating_doctors?.includes(user.id)

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('case_collaboration_comments')
      .select(`
        *,
        doctor:doctor_id (id, name, role)
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/case-collaboration/[id]/comments' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/case-collaboration/[id]/comments
 * Add a comment to a case
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const caseId = params.id
    const body = await req.json()
    const { comment_text, attachments, is_internal } = body

    if (!comment_text) {
      return NextResponse.json(
        { success: false, error: 'Comment text is required' },
        { status: 400 }
      )
    }

    // Verify access to case
    const { data: caseData } = await supabaseAdmin
      .from('case_collaborations')
      .select('primary_doctor_id, collaborating_doctors, patient_id')
      .eq('id', caseId)
      .single()

    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 })
    }

    const hasAccess =
      caseData.primary_doctor_id === user.id ||
      caseData.collaborating_doctors?.includes(user.id)

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('case_collaboration_comments')
      .insert({
        case_id: caseId,
        doctor_id: user.id,
        comment_text,
        attachments: attachments || [],
        is_internal: is_internal || false,
      })
      .select(`
        *,
        doctor:doctor_id (id, name, role)
      `)
      .single()

    if (error) throw error

    // Notify other doctors in the case
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      const allDoctors = [
        caseData.primary_doctor_id,
        ...(caseData.collaborating_doctors || []),
      ].filter((id) => id !== user.id)

      for (const doctorId of allDoctors) {
        await createNotification({
          userId: doctorId,
          ...NotificationTemplates.systemAlert(
            `تعليق جديد في حالة: ${caseData.patient_id}`
          ),
          title: 'تعليق جديد',
          entityType: 'case_collaboration',
          entityId: caseId,
        })
      }
    } catch (e) {
      console.error('Failed to notify doctors:', e)
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/case-collaboration/[id]/comments' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

