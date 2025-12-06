import { NextRequest, NextResponse } from 'next/server'
import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories'

/**
 * GET /api/whatsapp/settings
 * Get all WhatsApp settings (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const settings = await whatsappSettingsRepository.getAllSettings()
    
    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error: any) {
    console.error('Error fetching WhatsApp settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch WhatsApp settings',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whatsapp/settings
 * Create new WhatsApp settings
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      verify_token,
      access_token,
      phone_number_id,
      webhook_url,
      is_active = false,
    } = body

    // Validation
    if (!verify_token || !access_token || !phone_number_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: verify_token, access_token, phone_number_id',
          },
        },
        { status: 400 }
      )
    }

    const newSettings = await whatsappSettingsRepository.createSettings({
      verify_token,
      access_token,
      phone_number_id,
      webhook_url: webhook_url || null,
      is_active,
    })

    if (!newSettings) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create WhatsApp settings',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: newSettings,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating WhatsApp settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create WhatsApp settings',
        },
      },
      { status: 500 }
    )
  }
}

