import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { receptionRepository, patientRepository } from '@/infrastructure/supabase/repositories'
import { paymentVerificationService } from '@/core/business-rules/payment-verification'

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

    // Get queue item using repository
    const queueItem = await receptionRepository.getQueueItem(params.id)

    if (!queueItem) {
      return NextResponse.json(
        { success: false, error: 'Queue item not found' },
        { status: 404 }
      )
    }

    // Get patient details
    const patient = await patientRepository.findById(queueItem.patient_id)
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      )
    }

    // ============================================
    // BUSINESS RULES: Payment & Insurance Verification
    // ============================================
    const paymentCheck = await paymentVerificationService.verifyPayment(
      queueItem.patient_id,
      queueItem.service_type || 'consultation',
      queueItem.service_type
    )

    if (!paymentCheck.canProceed) {
      return NextResponse.json({
        success: false,
        error: paymentCheck.reason,
        requiredActions: paymentCheck.requiredActions,
        paymentStatus: paymentCheck.paymentStatus
      }, { status: 403 })
    }

    // Update queue status and confirm to doctor using repository
    await receptionRepository.confirmToDoctor(params.id, doctor_id)

    // Create patient visit record using repository
    const visit = await receptionRepository.createVisit({
      patient_id: queueItem.patient_id,
      queue_id: params.id,
      visit_date: new Date().toISOString(),
      visit_type: 'consultation',
      reception_notes: notes || null,
      created_by: user.id
    })

    // Update visit with payment and insurance status
    await receptionRepository.updateVisit(visit.id, {
      payment_status: paymentCheck.paymentStatus?.paid ? 'paid' : 'pending',
      insurance_status: paymentCheck.paymentStatus?.insuranceApproved ? 'approved' : 'pending'
    })

    // Create notification for doctor
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      const template = NotificationTemplates.systemAlert(
        `مريض ${patient.name || 'جديد'} في انتظارك - تم التأكيد من الاستقبال`
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

    // Get full visit details
    const fullVisit = await receptionRepository.getVisit(visit.id)

    return NextResponse.json({
      success: true,
      data: {
        visit: fullVisit,
        patient,
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

