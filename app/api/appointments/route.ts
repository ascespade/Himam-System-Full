import { supabaseAdmin } from '@/lib/supabase'
import { CreateAppointmentSchema } from '@/shared/schemas'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Check Auth
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

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*, patients(name, phone)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check Auth
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

    // Validate input
    const validation = CreateAppointmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.errors }, { status: 400 })
    }

    const { patient_id, doctor_id, date, duration, notes } = validation.data

    // Check availability (Basic check)
    // In a real system, we would check against doctor_schedules and existing appointments
    // For now, we'll just check if there's an overlapping appointment
    const startTime = new Date(date)
    const endTime = new Date(startTime.getTime() + duration * 60000)

    const { data: conflicts } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor_id)
      .lt('date', endTime.toISOString())
      .gt('date', new Date(startTime.getTime() - duration * 60000).toISOString()) // Rough overlap check

    if (conflicts && conflicts.length > 0) {
       return NextResponse.json({ success: false, error: 'Doctor is not available at this time' }, { status: 409 })
    }

    // Create Appointment
    const { data: appointment, error: createError } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id,
        doctor_id,
        date,
        duration,
        notes,
        status: 'confirmed'
      })
      .select()
      .single()

    if (createError) throw createError

    // Create Appointment Slot (Sync)
    await supabaseAdmin
      .from('appointment_slots')
      .insert({
        doctor_id,
        date: startTime.toISOString().split('T')[0],
        start_time: startTime.toISOString().split('T')[1],
        end_time: endTime.toISOString().split('T')[1],
        is_available: false,
        is_booked: true,
        appointment_id: appointment.id
      })

    // Send Slack Notification
    try {
      const { data: patient } = await supabaseAdmin.from('patients').select('name').eq('id', patient_id).single()
      const { data: doctor } = await supabaseAdmin.from('users').select('name').eq('id', doctor_id).single()

      const { notifyNewAppointment } = await import('@/lib/slack')
      await notifyNewAppointment({
        patient_name: patient?.name || 'Unknown',
        doctor_name: doctor?.name || 'Unknown',
        date: date
      })
    } catch (e) {
      console.error('Failed to send Slack notification:', e)
    }

    // Create Notifications
    try {
      const { data: patient } = await supabaseAdmin.from('patients').select('name').eq('id', patient_id).single()
      const { data: doctor } = await supabaseAdmin.from('users').select('name').eq('id', doctor_id).single()
      
      const { createNotification, createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
      
      const template = NotificationTemplates.appointmentCreated(
        patient?.name || 'مريض',
        doctor?.name || 'طبيب',
        date
      )

      // Notify admin
      await createNotificationForRole('admin', {
        ...template,
        entityType: 'appointment',
        entityId: appointment.id
      })

      // Notify doctor
      if (doctor_id) {
        await createNotification({
          userId: doctor_id,
          ...template,
          entityType: 'appointment',
          entityId: appointment.id
        })
      }
    } catch (e) {
      console.error('Failed to create notifications:', e)
    }

    // Audit Log
    try {
      const { logAudit } = await import('@/lib/audit')
      await logAudit(user.id, 'create_appointment', 'appointment', appointment.id, { patient_id, doctor_id, date }, req)
    } catch (e) {
      console.error('Failed to log audit:', e)
    }

    return NextResponse.json({ success: true, data: appointment })

  } catch (error: any) {
    console.error('Create appointment error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
