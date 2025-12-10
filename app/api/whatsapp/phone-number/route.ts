/**
 * WhatsApp Phone Number Management API
 * Get phone number details, quality rating, and verification status from Meta API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getSettings } from '@/lib/config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/phone-number
 * Get phone number details from Meta API
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
    const accessToken = settings.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not configured' },
        { status: 400 }
      )
    }

    // Fetch from Meta API
    try {
      const metaResponse = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,account_type,certificate`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!metaResponse.ok) {
        const errorData = await metaResponse.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Failed to fetch from Meta API')
      }

      const metaData = await metaResponse.json()

      // Update business profile with phone number details
      await supabaseAdmin
        .from('whatsapp_business_profiles')
        .update({
          display_phone_number: metaData.display_phone_number || null,
          quality_rating: metaData.quality_rating?.code || null,
          quality_rating_updated_at: metaData.quality_rating?.timestamp 
            ? new Date(metaData.quality_rating.timestamp * 1000).toISOString()
            : null,
          verification_status: metaData.verified_name ? 'verified' : 'unverified',
          account_type: metaData.account_type || null,
          certificate: metaData.certificate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('phone_number_id', phoneNumberId)

      return NextResponse.json({
        success: true,
        data: {
          phone_number_id: phoneNumberId,
          display_phone_number: metaData.display_phone_number,
          verified_name: metaData.verified_name,
          quality_rating: metaData.quality_rating,
          account_type: metaData.account_type,
          certificate: metaData.certificate,
        },
      })
    } catch (metaError: any) {
      console.error('Error fetching from Meta API:', metaError)
      return NextResponse.json(
        { success: false, error: metaError.message || 'Failed to fetch phone number details' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in phone number API:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

