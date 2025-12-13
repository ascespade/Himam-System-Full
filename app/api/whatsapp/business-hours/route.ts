/**
 * WhatsApp Business Hours Management API
 * Manage business hours for WhatsApp Business Profile
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getSettings } from '@/lib/config'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/business-hours
 * Get business hours
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
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

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const settings = await getSettings()
    const phoneNumberId = settings.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not configured' },
        { status: 400 }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from('whatsapp_business_profiles')
      .select('business_hours')
      .eq('phone_number_id', phoneNumberId)
      .single()

    return NextResponse.json({
      success: true,
      data: profile?.business_hours || {},
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/business-hours' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * PUT /api/whatsapp/business-hours
 * Update business hours
 */
export const PUT = withRateLimit(async function PUT(req: NextRequest) {
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

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { business_hours } = body

    if (!business_hours || typeof business_hours !== 'object') {
      return NextResponse.json(
        { success: false, error: 'business_hours must be an object' },
        { status: 400 }
      )
    }

    const settings = await getSettings()
    const phoneNumberId = settings.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not configured' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_business_profiles')
      .update({
        business_hours,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number_id', phoneNumberId)
      .select('id, business_name, business_description, business_email, business_website, business_address, business_category, profile_picture_url, cover_photo_url, phone_number_id, display_phone_number, waba_id, is_active, business_hours, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Create if doesn't exist
        const { data: newProfile } = await supabaseAdmin
          .from('whatsapp_business_profiles')
          .insert({
            phone_number_id: phoneNumberId,
            business_hours,
            is_active: true,
          })
          .select('id, business_name, business_description, business_email, business_website, business_address, business_category, profile_picture_url, cover_photo_url, phone_number_id, display_phone_number, waba_id, is_active, business_hours, created_at, updated_at')
          .single()

        return NextResponse.json({ success: true, data: newProfile })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/business-hours' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

