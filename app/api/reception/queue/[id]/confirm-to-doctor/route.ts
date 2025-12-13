import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/reception/queue/[id]/confirm-to-doctor
 * Confirm patient to doctor - Creates patient_visit and sets PatientContext for doctor
 * هذا هو الرابط بين الاستقبال والطبيب
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

    // Verify user is reception or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['reception', 'admin'].includes(userData.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { doctor_id, notes } = body

    if (!doctor_id) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      )
    }

    // Get queue item
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from('reception_queue')
      .select(`
        *,
        patients (*),
        appointments (*)
      `)
      .eq('id', params.id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json(
        { success: false, error: 'Queue item not found' },
        { status: 404 }
      )
    }

    // Update queue status
    await supabaseAdmin
      .from('reception_queue')
      .update({
        status: 'in_progress',
        called_at: new Date().toISOString()
      })
      .eq('id', params.id)

    // Create patient visit record
    const { data: visit, error: visitError } = await supabaseAdmin
      .from('patient_visits')
      .insert({
        patient_id: queueItem.patient_id,
        appointment_id: queueItem.appointment_id || null,
        queue_id: params.id,
        doctor_id: doctor_id,
        visit_date: new Date().toISOString(),
        check_in_time: queueItem.checked_in_at,
        confirmed_to_doctor_time: new Date().toISOString(),
        status: 'confirmed_to_doctor',
        notes: notes || null
      })
      .select(`
        *,
        patients (*),
        appointments (*)
      `)
      .single()

    if (visitError) throw visitError

    // Create notification for doctor
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      const template = NotificationTemplates.systemAlert(
        `مريض ${queueItem.patients?.name || 'جديد'} في انتظارك - تم التأكيد من الاستقبال`
      )
      await createNotification({
        userId: doctor_id,
        ...template,
        entityType: 'patient_visit',
        entityId: visit.id
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to create notification', e, { queueId: params.id, endpoint: '/api/reception/queue/[id]/confirm-to-doctor' })
    }

    return NextResponse.json({
      success: true,
      data: {
        visit,
        message: 'تم تأكيد المريض للطبيب بنجاح. سيظهر ملف المريض الكامل في شاشة الطبيب.'
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تأكيد المريض للطبيب'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error confirming patient to doctor', error, { endpoint: '/api/reception/queue/[id]/confirm-to-doctor', queueId: params.id })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

