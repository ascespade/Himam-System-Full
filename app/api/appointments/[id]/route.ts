import { supabaseAdmin } from '@/lib/supabase'
import { sendTextMessage } from '@/lib/whatsapp'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const { status, note } = await request.json()

  if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
  }

  try {
    // 1. Update Appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({ status, notes: note ? note : undefined })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

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
      }
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
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id

  try {
    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) throw error

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
  }
}
