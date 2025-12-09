<<<<<<< HEAD
import { supabaseAdmin } from '@/lib/supabase'
import { sendTextMessage } from '@/lib/whatsapp'
import { NextRequest, NextResponse } from 'next/server'
=======
/**
 * Appointment API Route - Individual Appointment Operations
 * GET, PUT, DELETE operations for specific appointment
 */
>>>>>>> cursor/fix-code-errors-and-warnings-8041

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

/**
 * GET /api/appointments/:id
 * Get appointment by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
<<<<<<< HEAD
  const id = params.id
  const body = await request.json()
  const { status, note, date, duration, session_type, color } = body

  try {
    // Build update object
    const updateData: any = {}
    if (status && ['confirmed', 'cancelled', 'completed', 'pending'].includes(status)) {
      updateData.status = status
    }
    if (note !== undefined) updateData.notes = note
    if (date) updateData.date = date
    if (duration) updateData.duration = duration
    if (session_type) updateData.session_type = session_type
    if (color) updateData.color = color
    updateData.updated_at = new Date().toISOString()

    // 1. Update Appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
=======
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        errorResponse('Appointment ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Appointment not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }
      throw error
    }

    return NextResponse.json(successResponse(appointment))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/appointments/:id
 * Update appointment
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()

    if (!id) {
      return NextResponse.json(
        errorResponse('Appointment ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Remove id from body if present
    const { id: _, ...updateData } = body

    // Validate date if provided
    if (updateData.date && updateData.time) {
      const appointmentDate = new Date(`${updateData.date}T${updateData.time}`)
      const now = new Date()
      if (appointmentDate < now) {
        return NextResponse.json(
          errorResponse('Cannot update appointment to past date'),
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
>>>>>>> cursor/fix-code-errors-and-warnings-8041
      .eq('id', id)
      .select()
      .single()

<<<<<<< HEAD
    if (error) throw error

    // If date changed, update appointment slot
    if (date && appointment) {
      const appointmentDate = new Date(date)
      const slotDate = appointmentDate.toISOString().split('T')[0]
      const slotStartTime = appointmentDate.toISOString().split('T')[1].split('.')[0]
      const slotEndTime = new Date(appointmentDate.getTime() + (appointment.duration || 30) * 60000)
        .toISOString().split('T')[1].split('.')[0]

      // Update or create appointment slot
      await supabaseAdmin
        .from('appointment_slots')
        .upsert({
          doctor_id: appointment.doctor_id,
          date: slotDate,
          start_time: slotStartTime,
          end_time: slotEndTime,
          is_available: false,
          is_booked: true,
          appointment_id: appointment.id
        }, {
          onConflict: 'appointment_id'
        })
    }

    // 2. Send WhatsApp Notification
    if (appointment && appointment.phone) {
      let message = ''
      if (status === 'confirmed') {
        message = `✅ *تم تأكيد موعدك!*\n\nعزيزي/تي ${appointment.patient_name}،\nتم تأكيد موعدك مع ${appointment.specialist} بتاريخ ${new Date(appointment.date).toLocaleString('ar-SA')}.\n\nننتظر زيارتكم في مركز الهمم.`
      } else if (status === 'cancelled') {
        message = `❌ *تحديث بخصوص موعدك*\n\nعزيزي/تي ${appointment.patient_name}،\nنأسف لإبلاغكم بأنه تم إلغاء الموعد المحدد بتاريخ ${new Date(appointment.date).toLocaleString('ar-SA')}.\nيرجى التواصل معنا لتحديد موعد جديد.`
      }

      if (message) {
        await sendTextMessage(appointment.phone, message)
=======
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Appointment not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
>>>>>>> cursor/fix-code-errors-and-warnings-8041
      }
      throw error
    }

<<<<<<< HEAD
    // 3. Create Notifications
    try {
      const { createNotification, createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
      
      let template
      if (status === 'confirmed') {
        template = NotificationTemplates.appointmentConfirmed(
          appointment.patient_name || 'مريض',
          appointment.date
        )
      } else if (status === 'cancelled') {
        template = NotificationTemplates.appointmentCancelled(
          appointment.patient_name || 'مريض',
          appointment.date
        )
      }

      if (template) {
        // Notify admin
        await createNotificationForRole('admin', {
          ...template,
          entityType: 'appointment',
          entityId: appointment.id
        })

        // Notify doctor if exists
        if (appointment.doctor_id) {
          await createNotification({
            userId: appointment.doctor_id,
            ...template,
            entityType: 'appointment',
            entityId: appointment.id
          })
        }
      }
    } catch (e) {
      console.error('Failed to create notifications:', e)
    }

    // Audit Log
    try {
      const { logAudit } = await import('@/lib/audit')
      // Note: We don't have user_id here easily without auth check, passing undefined for now or need to add auth check
      // Ideally we should add auth check to this route too
      await logAudit(undefined, 'update_appointment', 'appointment', id, { status }, request)
    } catch (e) {
      console.error('Failed to log audit:', e)
    }

    return NextResponse.json({ success: true, data: appointment })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
=======
    return NextResponse.json(successResponse(appointment))
  } catch (error: unknown) {
    return handleApiError(error)
>>>>>>> cursor/fix-code-errors-and-warnings-8041
  }
}

/**
 * DELETE /api/appointments/:id
 * Cancel appointment (soft delete by setting status to cancelled)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        errorResponse('Appointment ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Soft delete by setting status to cancelled
    const { error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Appointment not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }
      throw error
    }

<<<<<<< HEAD
    // Audit Log
    try {
      const { logAudit } = await import('@/lib/audit')
      await logAudit(undefined, 'delete_appointment', 'appointment', id, {}, request)
    } catch (e) {
      console.error('Failed to log audit:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
=======
    return NextResponse.json(successResponse({ id, cancelled: true }))
  } catch (error: unknown) {
    return handleApiError(error)
>>>>>>> cursor/fix-code-errors-and-warnings-8041
  }
}
