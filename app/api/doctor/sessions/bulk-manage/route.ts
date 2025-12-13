import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/doctor/sessions/bulk-manage
 * Bulk manage doctor sessions (reschedule day, cancel day, etc.)
 * إدارة الجلسات بشكل جماعي - تأجيل يوم كامل، إلغاء، إعادة جدولة
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
    const {
      operation_type, // 'reschedule_day', 'cancel_day', 'reschedule_range'
      target_date,
      end_date,
      reason,
      new_schedule // For reschedule: { date: '2024-01-20', time_shift: '+1 day' }
    } = body

    if (!operation_type || !target_date) {
      return NextResponse.json(
        { success: false, error: 'Operation type and target date are required' },
        { status: 400 }
      )
    }

    // Get affected sessions
    let query = supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('status', 'scheduled')

    if (operation_type === 'reschedule_day' || operation_type === 'cancel_day') {
      query = query.eq('date::date', target_date)
    } else if (operation_type === 'reschedule_range' && end_date) {
      query = query.gte('date::date', target_date).lte('date::date', end_date)
    }

    const { data: affectedSessions, error: sessionsError } = await query

    if (sessionsError) throw sessionsError

    if (!affectedSessions || affectedSessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'لا توجد جلسات متأثرة',
          affected_count: 0
        }
      })
    }

    // Create bulk operation record
    const { data: bulkOp, error: bulkError } = await supabaseAdmin
      .from('session_bulk_operations')
      .insert({
        doctor_id: user.id,
        operation_type,
        target_date,
        end_date: end_date || null,
        reason: reason || null,
        affected_sessions: affectedSessions.map(s => s.id),
        new_schedule: new_schedule || null,
        status: 'processing',
        created_by: user.id
      })
      .select()
      .single()

    if (bulkError) throw bulkError

    // Process operation
    let processedCount = 0
    let failedCount = 0
    const errors: any[] = []

    for (const session of affectedSessions) {
      try {
        if (operation_type === 'cancel_day') {
          // Cancel session
          await supabaseAdmin
            .from('sessions')
            .update({
              status: 'cancelled',
              notes: `ملغاة - ${reason || 'تأجيل يوم كامل'}`
            })
            .eq('id', session.id)

          // Cancel related appointment if exists
          if (session.appointment_id) {
            await supabaseAdmin
              .from('appointments')
              .update({ status: 'cancelled' })
              .eq('id', session.appointment_id)
          }

        } else if (operation_type === 'reschedule_day' || operation_type === 'reschedule_range') {
          // Reschedule session
          if (new_schedule) {
            let newDate: Date

            if (new_schedule.date) {
              newDate = new Date(new_schedule.date)
            } else if (new_schedule.time_shift) {
              // Calculate new date based on shift
              const originalDate = new Date(session.date)
              const shift = new_schedule.time_shift
              
              if (shift.includes('+')) {
                const days = parseInt(shift.match(/\d+/)?.[0] || '0')
                newDate = new Date(originalDate)
                newDate.setDate(newDate.getDate() + days)
              } else if (shift.includes('-')) {
                const days = parseInt(shift.match(/\d+/)?.[0] || '0')
                newDate = new Date(originalDate)
                newDate.setDate(newDate.getDate() - days)
              } else {
                newDate = originalDate
              }
            } else {
              throw new Error('Invalid new_schedule format')
            }

            // Update session
            await supabaseAdmin
              .from('sessions')
              .update({
                date: newDate.toISOString(),
                notes: `تم إعادة الجدولة - ${reason || 'تأجيل يوم كامل'}`
              })
              .eq('id', session.id)

            // Update related appointment if exists
            if (session.appointment_id) {
              await supabaseAdmin
                .from('appointments')
                .update({
                  date: newDate.toISOString(),
                  notes: `تم إعادة الجدولة - ${reason || 'تأجيل يوم كامل'}`
                })
                .eq('id', session.appointment_id)
            }

            // Notify patient
            try {
              const { data: patient } = await supabaseAdmin
                .from('patients')
                .select('name, phone')
                .eq('id', session.patient_id)
                .single()

              if (patient?.phone) {
                const { sendTextMessage } = await import('@/lib/whatsapp')
                await sendTextMessage(
                  patient.phone,
                  `مرحباً ${patient.name}،

تم إعادة جدولة جلستك:
- التاريخ الجديد: ${newDate.toLocaleDateString('ar-SA')}
- الوقت: ${newDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}

شكراً لتفهمك.`
                )
              }
            } catch (e) {
              const { logError } = await import('@/shared/utils/logger')
              logError('Failed to notify patient', e, { patientId: session.patient_id, sessionId: session.id, endpoint: '/api/doctor/sessions/bulk-manage' })
            }
          }
        }

        processedCount++
      } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

        failedCount++
        errors.push({
          session_id: session.id,
          error: errorMessage })
      }
    }

    // Update bulk operation status
    await supabaseAdmin
      .from('session_bulk_operations')
      .update({
        status: failedCount === 0 ? 'completed' : 'completed',
        processed_count: processedCount,
        failed_count: failedCount,
        error_log: errors.length > 0 ? errors : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', bulkOp.id)

    // Create notifications
    try {
      const { createNotification, NotificationTemplates } = await import('@/lib/notifications')
      const template = NotificationTemplates.systemAlert(
        `تم ${operation_type === 'cancel_day' ? 'إلغاء' : 'إعادة جدولة'} ${processedCount} جلسة${failedCount > 0 ? ` (فشل ${failedCount})` : ''}`
      )
      await createNotification({
        userId: user.id,
        ...template,
        entityType: 'bulk_operation',
        entityId: bulkOp.id
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to create notification', e, { bulkOpId: bulkOp.id, endpoint: '/api/doctor/sessions/bulk-manage' })
    }

    return NextResponse.json({
      success: true,
      data: {
        bulk_operation_id: bulkOp.id,
        affected_count: affectedSessions.length,
        processed_count: processedCount,
        failed_count: failedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/sessions/bulk-manage' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

