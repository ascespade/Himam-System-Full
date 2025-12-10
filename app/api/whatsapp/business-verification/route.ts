/**
 * WhatsApp Business Verification Status API
 * Get business verification status from Meta API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getSettings } from '@/lib/config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/business-verification
 * Get business verification status
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

    // Get WABA ID from settings or profile
    const { data: profile } = await supabaseAdmin
      .from('whatsapp_business_profiles')
      .select('waba_id')
      .eq('phone_number_id', phoneNumberId)
      .single()

    const wabaId = profile?.waba_id || settings.WHATSAPP_WABA_ID

    if (!wabaId) {
      return NextResponse.json({
        success: true,
        data: {
          verification_status: 'unknown',
          message: 'WABA ID not found. Please configure it in settings.',
        },
      })
    }

    // Fetch verification status from Meta API
    try {
      const metaResponse = await fetch(
        `https://graph.facebook.com/v20.0/${wabaId}?fields=message_template_namespace,account_review_status,ownership_type`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!metaResponse.ok) {
        const errorData = await metaResponse.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Failed to fetch verification status')
      }

      const metaData = await metaResponse.json()

      // Determine verification status
      let verificationStatus = 'unverified'
      if (metaData.account_review_status === 'approved') {
        verificationStatus = 'verified'
      } else if (metaData.account_review_status === 'pending') {
        verificationStatus = 'pending'
      } else if (metaData.account_review_status === 'rejected') {
        verificationStatus = 'rejected'
      }

      // Update business profile
      await supabaseAdmin
        .from('whatsapp_business_profiles')
        .update({
          verification_status,
          metadata: {
            ...(profile?.metadata || {}),
            account_review_status: metaData.account_review_status,
            ownership_type: metaData.ownership_type,
            message_template_namespace: metaData.message_template_namespace,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('phone_number_id', phoneNumberId)

      return NextResponse.json({
        success: true,
        data: {
          verification_status,
          account_review_status: metaData.account_review_status,
          ownership_type: metaData.ownership_type,
          message_template_namespace: metaData.message_template_namespace,
        },
      })
    } catch (metaError: any) {
      console.error('Error fetching verification status:', metaError)
      return NextResponse.json(
        { success: false, error: metaError.message || 'Failed to fetch verification status' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in business verification API:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

