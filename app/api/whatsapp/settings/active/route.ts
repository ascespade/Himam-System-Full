import { NextRequest, NextResponse } from 'next/server'
import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories'

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/settings/active' })

    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: errorMessage || 'Failed to fetch active WhatsApp settings',
        },
      },
      { status: 500 }
    )
  }
}

