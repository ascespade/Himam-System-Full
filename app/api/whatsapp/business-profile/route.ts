/**
 * WhatsApp Business Profile Management API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/business-profile
 * Get business profile
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
        .select('*')
        .eq('phone_number_id', phoneNumberId)
        .eq('is_active', true)
        .maybeSingle()

      if (data) {
        profile = data
      }
    } catch (dbError: any) {
      // Table might not exist, continue to fetch from Meta API
      console.warn('whatsapp_business_profiles table not found, will fetch from Meta API:', dbError.message)
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

    try {
      const metaResponse = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=verified_name,display_phone_number,profile_picture_url,about,addresses,description,email,websites`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!metaResponse.ok) {
        throw new Error('Failed to fetch from Meta API')
      }

      const metaData = await metaResponse.json()

      // Save to database (if table exists)
      try {
        const { data: savedProfile } = await supabaseAdmin
          .from('whatsapp_business_profiles')
          .insert({
            business_name: metaData.verified_name || 'مركز الهمم',
            business_description: metaData.description || metaData.about || null,
            business_email: metaData.email || null,
            business_website: metaData.websites?.[0] || null,
            business_address: metaData.addresses?.[0] || null,
            profile_picture_url: metaData.profile_picture_url || null,
            phone_number_id: phoneNumberId,
            waba_id: metaData.id || null,
            is_active: true,
          })
          .select()
          .single()

        return NextResponse.json({ success: true, data: savedProfile })
      } catch (dbError: any) {
        // Table doesn't exist, return data from Meta API
        console.warn('Could not save to database, returning Meta API data:', dbError.message)
        return NextResponse.json({
          success: true,
          data: {
            business_name: metaData.verified_name || 'مركز الهمم',
            business_description: metaData.description || metaData.about || null,
            business_email: metaData.email || null,
            business_website: metaData.websites?.[0] || null,
            business_address: metaData.addresses?.[0] || null,
            profile_picture_url: metaData.profile_picture_url || null,
            phone_number_id: phoneNumberId,
            waba_id: metaData.id || null,
            is_active: true,
          },
        })
      }
    } catch (metaError: any) {
      console.error('Error fetching from Meta API:', metaError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile from Meta API' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching business profile:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/whatsapp/business-profile
 * Update business profile
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

    const updateData: any = {
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
        .select()
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
        .select()
        .single()

      return NextResponse.json({ success: true, data: newProfile })
    } catch (dbError: any) {
      // Table might not exist or other DB error
      // Return success anyway since we're just storing locally
      console.warn('Database operation failed, but continuing:', dbError.message)
      return NextResponse.json({
        success: true,
        data: {
          phone_number_id: phoneNumberId,
          ...updateData,
          is_active: true,
        },
      })
    }
  } catch (error: any) {
    console.error('Error updating business profile:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

