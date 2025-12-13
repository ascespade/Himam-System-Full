/**
 * WhatsApp Status API
 * Unified endpoint for checking WhatsApp connection status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { getSettings } from '@/lib/config'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/status
 * Get WhatsApp connection status
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
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Get settings
    const settings = await getSettings()
    const token = settings.WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN
    const phoneNumberId = settings.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

    // Check if basic settings exist
    if (!token || !phoneNumberId) {
      return NextResponse.json(
        successResponse({
          status: 'disconnected',
          message: 'WhatsApp credentials not configured',
          settings: {
            hasToken: !!token,
            hasPhoneNumberId: !!phoneNumberId,
            isActive: false,
          },
        })
      )
    }

    // Check active settings from database
    const { data: whatsappSettings } = await supabaseAdmin
      .from('whatsapp_settings')
      .select('is_active, access_token, phone_number_id')
      .eq('is_active', true)
      .single()

    if (!whatsappSettings || !whatsappSettings.is_active) {
      return NextResponse.json(
        successResponse({
          status: 'disconnected',
          message: 'WhatsApp settings not active',
          settings: {
            hasToken: !!token,
            hasPhoneNumberId: !!phoneNumberId,
            isActive: false,
          },
        })
      )
    }

    // Test connection by checking business profile (lightweight check)
    try {
      const testResponse = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=verified_name`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (testResponse.ok) {
        return NextResponse.json(
          successResponse({
            status: 'connected',
            message: 'WhatsApp is connected and active',
            settings: {
              hasToken: true,
              hasPhoneNumberId: true,
              isActive: true,
            },
            lastChecked: new Date().toISOString(),
          })
        )
      } else {
        return NextResponse.json(
          successResponse({
            status: 'disconnected',
            message: 'Failed to connect to WhatsApp API',
            settings: {
              hasToken: true,
              hasPhoneNumberId: true,
              isActive: true,
            },
          })
        )
      }
    } catch (apiError) {
      return NextResponse.json(
        successResponse({
          status: 'disconnected',
          message: 'Error connecting to WhatsApp API',
          settings: {
            hasToken: true,
            hasPhoneNumberId: true,
            isActive: true,
          },
        })
      )
    }
  } catch (error: any) {
    console.error('Error checking WhatsApp status:', error)
    return NextResponse.json(
      errorResponse(error),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

