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
