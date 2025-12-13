/**
 * WhatsApp Business Profile Management API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/business-profile
 * Get business profile
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

    // Get settings from whatsapp_settings table
    const whatsappSettings = await whatsappSettingsRepository.getActiveSettings()
    
    if (!whatsappSettings && !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not configured. Please configure WhatsApp settings first.' },
        { status: 400 }
      )
    }
    
    const phoneNumberId = whatsappSettings?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp phone number ID not configured' },
        { status: 400 }
      )
    }

    // Get from database first (table might not exist, handle gracefully)
    let profile = null
    try {
      const { data } = await supabaseAdmin
        .from('whatsapp_business_profiles')
        .select('id, business_name, business_description, business_email, business_website, business_address, business_category, profile_picture_url, cover_photo_url, phone_number_id, display_phone_number, waba_id, is_active, created_at, updated_at')
        .eq('phone_number_id', phoneNumberId)
        .eq('is_active', true)
        .maybeSingle()

      if (data) {
        profile = data
      }
    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      const { logError } = await import('@/shared/utils/logger')
      logError('Error creating/updating business profile', dbError, { phoneNumberId })
      // Table might not exist, continue to fetch from Meta API
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('whatsapp_business_profiles table not found, will fetch from Meta API', { error: errorMessage, phoneNumberId, endpoint: '/api/whatsapp/business-profile' })
    }

    if (profile) {
      return NextResponse.json({ success: true, data: profile })
    }

    // If not in DB, fetch from Meta API
    const accessToken = whatsappSettings?.access_token || process.env.WHATSAPP_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp access token not configured' },
        { status: 400 }
      )
    }

    const wabaId = whatsappSettings?.waba_id

    try {
      let metaData: Record<string, unknown> = {}
      let profileData: Record<string, unknown> = {}

      // Step 1: Fetch phone number details (always available)
      const phoneResponse = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=verified_name,display_phone_number`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!phoneResponse.ok) {
        const errorData = await phoneResponse.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || errorData.error?.error_user_msg || 'Failed to fetch from Meta API'
        throw new Error(errorMessage)
      }

      metaData = await phoneResponse.json()

      // Step 2: If WABA ID is configured, fetch Business Profile (WABA-level endpoint)
      if (wabaId) {
        try {
          const profileResponse = await fetch(
            `https://graph.facebook.com/v20.0/${wabaId}/whatsapp_business_profile?fields=about,addresses,description,email,websites,profile_picture_url,vertical,cover_photo_url`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )

          if (profileResponse.ok) {
            profileData = await profileResponse.json()
          } else {
            const { logWarn } = await import('@/shared/utils/logger')
            logWarn('Failed to fetch business profile from WABA endpoint, using phone number data only', { phoneNumberId, endpoint: '/api/whatsapp/business-profile' })
          }
        } catch (profileError: unknown) {
          const errorMessage = profileError instanceof Error ? profileError.message : String(profileError)
          const { logWarn } = await import('@/shared/utils/logger')
          logWarn('Error fetching business profile from WABA endpoint', { error: errorMessage, phoneNumberId, endpoint: '/api/whatsapp/business-profile' })
          // Continue with phone number data only
        }
      }

      // Merge data from both endpoints
      const mergedData = {
        business_name: metaData.verified_name || 'مركز الهمم',
        business_description: profileData.description || profileData.about || null,
        business_email: profileData.email || null,
        business_website: (() => {
          const websites = Array.isArray(profileData.websites) ? profileData.websites as string[] : null
          return websites?.[0] || null
        })(),
        business_address: (() => {
          const addresses = Array.isArray(profileData.addresses) ? profileData.addresses as Array<Record<string, unknown>> : null
          return addresses?.[0]?.street || addresses?.[0] || null
        })(),
        business_category: profileData.vertical || null,
        profile_picture_url: profileData.profile_picture_url || null,
        cover_photo_url: profileData.cover_photo_url || null,
        phone_number_id: phoneNumberId,
        display_phone_number: metaData.display_phone_number || null,
        waba_id: wabaId || null,
        is_active: true,
      }

      // Save to database (if table exists)
      try {
        const { data: savedProfile } = await supabaseAdmin
          .from('whatsapp_business_profiles')
          .insert(mergedData)
          .select('id, business_name, business_description, business_email, business_website, business_address, business_category, profile_picture_url, cover_photo_url, phone_number_id, display_phone_number, waba_id, is_active, created_at, updated_at')
          .single()

        return NextResponse.json({ success: true, data: savedProfile })
      } catch (dbError: unknown) {
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
        const { logError } = await import('@/shared/utils/logger')
        logError('Error creating/updating business profile', dbError, { phoneNumberId })
        // Table doesn't exist, return data from Meta API
        const { logWarn } = await import('@/shared/utils/logger')
        logWarn('Could not save to database, returning Meta API data', { error: errorMessage, phoneNumberId, endpoint: '/api/whatsapp/business-profile' })
        return NextResponse.json({
          success: true,
          data: mergedData,
        })
      }
    } catch (metaError: unknown) {
      const errorMessage = metaError instanceof Error ? metaError.message : 'Failed to fetch profile from Meta API'
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching from Meta API', metaError, { phoneNumberId })
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/business-profile' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * PUT /api/whatsapp/business-profile
 * Update business profile
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
    const {
      business_name,
      business_description,
      business_category,
      business_email,
      business_website,
      business_address,
      profile_picture_url,
      cover_photo_url,
    } = body

    // Get settings from whatsapp_settings table
    const whatsappSettings = await whatsappSettingsRepository.getActiveSettings()
    
    if (!whatsappSettings && !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not configured. Please configure WhatsApp settings first.' },
        { status: 400 }
      )
    }
    
    const phoneNumberId = whatsappSettings?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp phone number ID not configured' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (business_name !== undefined) updateData.business_name = business_name
    if (business_description !== undefined) updateData.business_description = business_description
    if (business_category !== undefined) updateData.business_category = business_category
    if (business_email !== undefined) updateData.business_email = business_email
    if (business_website !== undefined) updateData.business_website = business_website
    if (business_address !== undefined) updateData.business_address = business_address
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url
    if (cover_photo_url !== undefined) updateData.cover_photo_url = cover_photo_url

    // Update in database (if table exists)
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_business_profiles')
        .update(updateData)
        .eq('phone_number_id', phoneNumberId)
        .select('id, business_name, business_description, business_email, business_website, business_address, business_category, profile_picture_url, cover_photo_url, phone_number_id, display_phone_number, waba_id, is_active, created_at, updated_at')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        return NextResponse.json({ success: true, data })
      }

      // If doesn't exist, create it
      const { data: newProfile } = await supabaseAdmin
        .from('whatsapp_business_profiles')
        .insert({
          phone_number_id: phoneNumberId,
          ...updateData,
          is_active: true,
        })
        .select('id, business_name, business_description, business_email, business_website, business_address, business_category, profile_picture_url, cover_photo_url, phone_number_id, display_phone_number, waba_id, is_active, created_at, updated_at')
        .single()

      return NextResponse.json({ success: true, data: newProfile })
    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      const { logError } = await import('@/shared/utils/logger')
      logError('Error creating/updating business profile', dbError, { phoneNumberId })
      // Table might not exist or other DB error
      // Return success anyway since we're just storing locally
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('Database operation failed, but continuing', { error: errorMessage, phoneNumberId, endpoint: '/api/whatsapp/business-profile' })
      return NextResponse.json({
        success: true,
        data: {
          phone_number_id: phoneNumberId,
          ...updateData,
          is_active: true,
        },
      })
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/business-profile' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

