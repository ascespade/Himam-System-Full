/**
 * Video Recording Configuration API
 * Dynamic configuration for video session recording
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/system/config/video-recording
 * Get video recording configuration
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
    const doctorId = searchParams.get('doctor_id')
    const sessionType = searchParams.get('session_type') // 'video_call', 'slack_huddle', etc.

    // Get global configuration
    const { data: globalConfig } = await supabaseAdmin
      .from('system_configurations')
      .select('value')
      .eq('category', 'video_recording')
      .eq('key', 'default_enabled')
      .single()

    const defaultEnabled = globalConfig?.value === 'true' || false

    // Get doctor-specific configuration if doctor_id provided
    let doctorConfig = null
    if (doctorId) {
      const { data: docConfig } = await supabaseAdmin
        .from('system_configurations')
        .select('value')
        .eq('category', 'video_recording')
        .eq('key', `doctor_${doctorId}_enabled`)
        .single()

      doctorConfig = docConfig?.value === 'true'
    }

    // Get session type specific configuration
    let sessionTypeConfig = null
    if (sessionType) {
      const { data: sessionConfig } = await supabaseAdmin
        .from('system_configurations')
        .select('value')
        .eq('category', 'video_recording')
        .eq('key', `session_type_${sessionType}_enabled`)
        .single()

      sessionTypeConfig = sessionConfig?.value === 'true'
    }

    // Priority: doctor-specific > session-type > global
    const recordingEnabled = doctorConfig !== null
      ? doctorConfig
      : sessionTypeConfig !== null
      ? sessionTypeConfig
      : defaultEnabled

    // Get additional settings
    const { data: autoUploadConfig } = await supabaseAdmin
      .from('system_configurations')
      .select('value')
      .eq('category', 'video_recording')
      .eq('key', 'auto_upload_enabled')
      .single()

    const { data: retentionDaysConfig } = await supabaseAdmin
      .from('system_configurations')
      .select('value')
      .eq('category', 'video_recording')
      .eq('key', 'retention_days')
      .single()

    return NextResponse.json({
      success: true,
      data: {
        recording_enabled: recordingEnabled,
        auto_upload_enabled: autoUploadConfig?.value === 'true' || false,
        retention_days: parseInt(retentionDaysConfig?.value || '90'),
        provider: 'slack_huddle', // Can be 'slack_huddle', 'zoom', 'google_meet'
        doctor_specific: doctorConfig !== null,
        session_type_specific: sessionTypeConfig !== null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching video recording config:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/system/config/video-recording
 * Update video recording configuration
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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Only admin and doctor (for their own config) can update
    if (!userData || (userData.role !== 'admin' && userData.role !== 'doctor')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      recording_enabled,
      auto_upload_enabled,
      retention_days,
      doctor_id,
      session_type,
    } = body

    const updates: Array<Promise<any>> = []

    // Update global or specific configuration
    if (doctor_id && userData.role === 'doctor' && doctor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Doctors can only update their own configuration' },
        { status: 403 }
      )
    }

    const configKey = doctor_id
      ? `doctor_${doctor_id}_enabled`
      : session_type
      ? `session_type_${session_type}_enabled`
      : 'default_enabled'

    if (recording_enabled !== undefined) {
      updates.push(
        supabaseAdmin
          .from('system_configurations')
          .upsert({
            category: 'video_recording',
            key: configKey,
            value: recording_enabled.toString(),
            description: doctor_id
              ? `Video recording enabled for doctor ${doctor_id}`
              : session_type
              ? `Video recording enabled for session type ${session_type}`
              : 'Default video recording enabled',
            is_editable: true,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'category,key',
          })
      )
    }

    if (auto_upload_enabled !== undefined && userData.role === 'admin') {
      updates.push(
        supabaseAdmin
          .from('system_configurations')
          .upsert({
            category: 'video_recording',
            key: 'auto_upload_enabled',
            value: auto_upload_enabled.toString(),
            description: 'Automatically upload recordings to storage',
            is_editable: true,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'category,key',
          })
      )
    }

    if (retention_days !== undefined && userData.role === 'admin') {
      updates.push(
        supabaseAdmin
          .from('system_configurations')
          .upsert({
            category: 'video_recording',
            key: 'retention_days',
            value: retention_days.toString(),
            description: 'Number of days to retain recordings',
            is_editable: true,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'category,key',
          })
      )
    }

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: 'Video recording configuration updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating video recording config:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

