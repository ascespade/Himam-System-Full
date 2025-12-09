<<<<<<< HEAD
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
=======
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

/**
 * GET /api/appointments
 * Retrieve appointments with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const patient_id = searchParams.get('patient_id')
    const doctor_id = searchParams.get('doctor_id')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .limit(limit)

    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id)
    }

    if (date) {
      query = query.eq('date', date)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: appointments, error } = await query
>>>>>>> cursor/fix-code-errors-and-warnings-8041

    if (error) throw error

    return NextResponse.json(successResponse(appointments || []))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { patient_id, doctor_id, date, time, appointment_type, notes } = body

    // Validation
    if (!patient_id) {
      return NextResponse.json(
        errorResponse('Patient ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    if (!date) {
      return NextResponse.json(
        errorResponse('Date is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    if (!time) {
      return NextResponse.json(
        errorResponse('Time is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate date is not in the past
    const appointmentDate = new Date(`${date}T${time}`)
    const now = new Date()
    if (appointmentDate < now) {
      return NextResponse.json(
        errorResponse('Cannot book appointments in the past'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id,
        doctor_id: doctor_id || null,
        date,
        time,
        appointment_type: appointment_type || 'consultation',
        status: 'scheduled',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(successResponse(appointment), { status: HTTP_STATUS.CREATED })
  } catch (error: unknown) {
    return handleApiError(error)
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
