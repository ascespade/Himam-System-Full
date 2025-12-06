import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTextMessage } from '@/lib/whatsapp'

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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
