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

    // ============================================
    // BUSINESS RULES: Payment & Insurance Verification
    // ============================================
    try {
      const { paymentVerificationService } = await import('@/core/business-rules/payment-verification')
      
      const paymentCheck = await paymentVerificationService.verifyPayment(
        queueItem.patient_id,
        queueItem.appointments?.service_type || 'consultation',
        queueItem.appointments?.service_type
      )

      if (!paymentCheck.canProceed) {
        return NextResponse.json({
          success: false,
          error: paymentCheck.reason,
          requiredActions: paymentCheck.requiredActions,
          paymentStatus: paymentCheck.paymentStatus
        }, { status: 403 })
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      // Continue if verification service fails (graceful degradation)
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
      console.error('Failed to create notification:', e)
    }

    return NextResponse.json({
      success: true,
      data: {
        visit,
        message: 'تم تأكيد المريض للطبيب بنجاح. سيظهر ملف المريض الكامل في شاشة الطبيب.'
      }
    })
  } catch (error: any) {
    console.error('Error confirming patient to doctor:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

