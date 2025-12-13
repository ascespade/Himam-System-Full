/**
 * Appointment API Route - Individual Appointment Operations
 * GET, PUT, DELETE operations for specific appointment
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { sendTextMessage } from '@/lib/whatsapp-messaging'
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
    const { status, note, date, duration, session_type, color } = body

    if (!id) {
      return NextResponse.json(
        errorResponse('Appointment ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (status && ['confirmed', 'cancelled', 'completed', 'pending'].includes(status)) {
      updateData.status = status
    }
    if (note !== undefined) updateData.notes = note
    if (date) updateData.date = date
    if (duration) updateData.duration = duration
    if (session_type) updateData.session_type = session_type
    if (color) updateData.color = color
    updateData.updated_at = new Date().toISOString()

    // Validate date if provided
    if (date && body.time) {
      const appointmentDate = new Date(`${date}T${body.time}`)
      const now = new Date()
      if (appointmentDate < now) {
        return NextResponse.json(
          errorResponse('Cannot update appointment to past date'),
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
    }

    // Update Appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
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

    // Send WhatsApp Notification if status changed
    if (status && appointment) {
      try {
        const { data: patient } = await supabaseAdmin
          .from('patients')
          .select('name, phone')
          .eq('id', appointment.patient_id)
          .single()

        if (patient?.phone) {
          let message = ''
          if (status === 'confirmed') {
            message = `✅ *تم تأكيد موعدك!*\n\nعزيزي/تي ${patient.name || 'المريض'}،\nتم تأكيد موعدك بتاريخ ${new Date(appointment.date || date).toLocaleString('ar-SA')}.\n\nننتظر زيارتكم في مركز الهمم.`
          } else if (status === 'cancelled') {
            message = `❌ *تحديث بخصوص موعدك*\n\nعزيزي/تي ${patient.name || 'المريض'}،\nنأسف لإبلاغكم بأنه تم إلغاء الموعد المحدد بتاريخ ${new Date(appointment.date || date).toLocaleString('ar-SA')}.\nيرجى التواصل معنا لتحديد موعد جديد.`
          }

          if (message) {
            await sendTextMessage(patient.phone, message)
          }
        }
      } catch (whatsappError) {
        // Log but don't fail the request
        const { logError } = await import('@/shared/utils/logger')
        logError('Failed to send WhatsApp notification', whatsappError, { appointmentId: params.id, endpoint: '/api/appointments/[id]' })
      }
    }

    return NextResponse.json(successResponse(appointment))
  } catch (error: unknown) {
    return handleApiError(error)
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

    return NextResponse.json(successResponse({ id, cancelled: true }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
