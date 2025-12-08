import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/video-sessions
 * Get doctor's video sessions
 */
export async function GET(req: NextRequest) {
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

    const { data, error } = await supabaseAdmin
      .from('video_sessions')
      .select(`
        *,
        sessions (
          id,
          date,
          session_type,
          status
        ),
        patients (
          id,
          name,
          phone
        )
      `)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('Error fetching video sessions:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/doctor/video-sessions
 * Create new video session (for remote therapy)
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
    const { patient_id, appointment_id, session_id, scheduled_date } = body

    if (!patient_id || !scheduled_date) {
      return NextResponse.json({ success: false, error: 'Patient ID and scheduled date are required' }, { status: 400 })
    }

    // Generate meeting URL (using Zoom/Google Meet API or custom solution)
    // For now, we'll generate a placeholder
    const meetingId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const meetingUrl = `https://meet.himam.sa/${meetingId}`

    // Create session first if not provided
    let finalSessionId = session_id
    if (!session_id) {
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .insert({
          doctor_id: user.id,
          patient_id,
          appointment_id: appointment_id || null,
          date: scheduled_date,
          duration: 30,
          session_type: 'video_call',
          status: 'scheduled'
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      finalSessionId = newSession.id
    }

    // Create video session
    const { data, error } = await supabaseAdmin
      .from('video_sessions')
      .insert({
        session_id: finalSessionId,
        appointment_id: appointment_id || null,
        doctor_id: user.id,
        patient_id,
        meeting_url: meetingUrl,
        meeting_id: meetingId,
        recording_status: 'pending'
      })
      .select(`
        *,
        sessions (
          id,
          date,
          session_type
        ),
        patients (
          id,
          name,
          phone
        )
      `)
      .single()

    if (error) throw error

    // TODO: Send meeting link to patient via WhatsApp/SMS
    // TODO: Integrate with actual video conferencing service (Zoom, Google Meet, etc.)

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating video session:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

