import { NextRequest, NextResponse } from 'next/server'
import { whatsappSettingsRepository } from '@/src/infrastructure/supabase/repositories/whatsapp-settings.repository'

/**
 * GET /api/whatsapp/settings/active
 * Get active WhatsApp settings
 */
export async function GET(req: NextRequest) {
  try {
    const settings = await whatsappSettingsRepository.getActiveSettings()

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No active WhatsApp settings found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error: any) {
    console.error('Error fetching active WhatsApp settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch active WhatsApp settings',
        },
      },
      { status: 500 }
    )
  }
}

