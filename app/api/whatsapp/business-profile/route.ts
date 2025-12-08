/**
 * WhatsApp Business Profile Management API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getSettings } from '@/lib/config'

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

    const settings = await getSettings()
    const phoneNumberId = settings.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not configured' },
        { status: 400 }
      )
    }

    // Get from database first
    const { data: profile } = await supabaseAdmin
      .from('whatsapp_business_profiles')
      .select('*')
      .eq('phone_number_id', phoneNumberId)
      .eq('is_active', true)
      .single()

    if (profile) {
      return NextResponse.json({ success: true, data: profile })
    }

    // If not in DB, fetch from Meta API
    const accessToken = settings.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
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

      // Save to database
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

    const settings = await getSettings()
    const phoneNumberId = settings.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not configured' },
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

    // Update in database
    const { data, error } = await supabaseAdmin
      .from('whatsapp_business_profiles')
      .update(updateData)
      .eq('phone_number_id', phoneNumberId)
      .select()
      .single()

    if (error) {
      // If doesn't exist, create it
      if (error.code === 'PGRST116') {
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
      }
      throw error
    }

    // Optionally update Meta API (if supported)
    // Note: Meta API has limited support for updating profile via API
    // Most updates need to be done via Meta Business Manager

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating business profile:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

