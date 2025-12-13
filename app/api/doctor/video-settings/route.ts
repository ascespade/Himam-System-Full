/**
 * Video Sessions Settings API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/video-settings
 * Get video session settings for a doctor
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

    // Get settings from clinic_settings table or use defaults
    const { data: clinicSettings } = await supabaseAdmin
      .from('clinic_settings')
      .select('video_settings')
      .eq('doctor_id', user.id)
      .single()

    const defaultSettings = {
      provider: 'slack_huddle',
      recording_enabled: false,
      auto_record: false,
      quality: 'high',
      max_duration: 60,
      require_consent: true,
      notifications_enabled: true,
    }

    const settings = clinicSettings?.video_settings || defaultSettings

    return NextResponse.json({ success: true, data: settings })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/video-settings' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/doctor/video-settings
 * Update video session settings for a doctor
 */
export async function PUT(req: NextRequest) {
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

    // Check if clinic_settings exists for this doctor
    const { data: existing } = await supabaseAdmin
      .from('clinic_settings')
      .select('id')
      .eq('doctor_id', user.id)
      .single()

    if (existing) {
      // Update existing settings
      const { data, error } = await supabaseAdmin
        .from('clinic_settings')
        .update({
          video_settings: body,
          updated_at: new Date().toISOString(),
        })
        .eq('doctor_id', user.id)
        .select('video_settings')
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data: data.video_settings })
    } else {
      // Create new settings
      const { data, error } = await supabaseAdmin
        .from('clinic_settings')
        .insert({
          doctor_id: user.id,
          video_settings: body,
        })
        .select('video_settings')
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data: data.video_settings })
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/video-settings' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
