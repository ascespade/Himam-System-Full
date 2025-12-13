/**
 * Appointments API Route
 * Manages appointment data with authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

/**
 * GET /api/appointments
 * Retrieve appointments with optional filters
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
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
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const patient_id = searchParams.get('patient_id')
    const doctor_id = searchParams.get('doctor_id')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from('appointments')
      .select('id, patient_id, doctor_id, date, time, duration, appointment_type, status, notes, created_at, updated_at')
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
}, 'api')

/**
 * POST /api/appointments
 * Create a new appointment
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
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
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const body = await req.json()
    const { patient_id, doctor_id, date, time, appointment_type, notes, duration } = body

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

    if (!time && !duration) {
      return NextResponse.json(
        errorResponse('Time or duration is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate date is not in the past
    const appointmentDate = time 
      ? new Date(`${date}T${time}`)
      : new Date(date)
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
        time: time || null,
        duration: duration || 30,
        appointment_type: appointment_type || 'consultation',
        status: 'scheduled',
        notes: notes || null,
      })
      .select('id, patient_id, doctor_id, date, time, duration, appointment_type, status, notes, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json(successResponse(appointment), { status: HTTP_STATUS.CREATED })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}, 'api')
