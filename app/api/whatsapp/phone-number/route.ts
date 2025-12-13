/**
 * WhatsApp Phone Number Management API
 * Get phone number details, quality rating, and verification status from Meta API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/phone-number
 * Get phone number details from Meta API
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
    const phoneNumberId = whatsappSettings?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = whatsappSettings?.access_token || process.env.WHATSAPP_ACCESS_TOKEN

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

      // Update business profile with phone number details (if table exists)
      try {
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
      } catch (dbError: unknown) {
        // Table might not exist, continue anyway
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
        const { logWarn } = await import('@/shared/utils/logger')
        logWarn('Could not update business profile', { error: errorMessage, phoneNumberId, endpoint: '/api/whatsapp/phone-number' })
      }

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
    } catch (metaError: unknown) {
      const errorMessage = metaError instanceof Error ? metaError.message : 'Failed to fetch phone number details'
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
    logError('Error', error, { endpoint: '/api/whatsapp/phone-number' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'strict')

