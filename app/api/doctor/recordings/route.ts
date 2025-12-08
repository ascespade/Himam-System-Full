/**
 * Session Recording Management API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/recordings
 * Get video session recordings for a doctor
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

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patient_id')
    const status = searchParams.get('status') // 'enabled', 'completed', 'failed'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = supabaseAdmin
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
      .not('recording_status', 'is', null)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (status) {
      query = query.eq('recording_status', status)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching recordings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/doctor/recordings/[id]
 * Delete a recording (soft delete - mark as deleted)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recordingId = params.id

    // Verify ownership
    const { data: recording } = await supabaseAdmin
      .from('video_sessions')
      .select('doctor_id, recording_url')
      .eq('id', recordingId)
      .single()

    if (!recording || recording.doctor_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not found or unauthorized' }, { status: 404 })
    }

    // Soft delete - remove recording URL but keep session
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('video_sessions')
      .update({
        recording_url: null,
        recording_status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordingId)
      .select()
      .single()

    if (updateError) throw updateError

    // Optionally delete from storage
    if (recording.recording_url) {
      try {
        // Extract file path from URL
        const urlParts = recording.recording_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        await supabaseAdmin.storage
          .from('recordings')
          .remove([`video-sessions/${recordingId}/${fileName}`])
      } catch (storageError) {
        console.error('Error deleting from storage:', storageError)
        // Don't fail if storage deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recording deleted successfully',
      data: updated,
    })
  } catch (error: any) {
    console.error('Error deleting recording:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

