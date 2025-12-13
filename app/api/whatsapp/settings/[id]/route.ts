import { NextRequest, NextResponse } from 'next/server'
import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories'

/**
 * GET /api/whatsapp/settings/[id]
 * Get specific WhatsApp settings by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const allSettings = await whatsappSettingsRepository.getAllSettings()
    const settings = allSettings.find((s) => s.id === id)

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'WhatsApp settings not found',
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
    logError('Error', error, { endpoint: '/api/whatsapp/settings/[id]' })

    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: errorMessage || 'Failed to fetch WhatsApp settings',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/whatsapp/settings/[id]
 * Update WhatsApp settings
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const {
      name,
      verify_token,
      access_token,
      phone_number_id,
      webhook_url,
      app_id,
      waba_id,
      phone_number,
      is_active,
    } = body

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (verify_token !== undefined) updates.verify_token = verify_token
    if (access_token !== undefined) updates.access_token = access_token
    if (phone_number_id !== undefined) updates.phone_number_id = phone_number_id
    if (webhook_url !== undefined) updates.webhook_url = webhook_url
    if (app_id !== undefined) updates.app_id = app_id
    if (waba_id !== undefined) updates.waba_id = waba_id
    if (phone_number !== undefined) updates.phone_number = phone_number
    if (is_active !== undefined) updates.is_active = is_active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No fields to update',
          },
        },
        { status: 400 }
      )
    }

    const updatedSettings = await whatsappSettingsRepository.updateSettings(
      id,
      updates
    )

    if (!updatedSettings) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update WhatsApp settings',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/settings/[id]' })

    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: errorMessage || 'Failed to update WhatsApp settings',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/whatsapp/settings/[id]
 * Delete WhatsApp settings
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Note: The repository doesn't have a delete method, so we'll deactivate instead
    const updatedSettings = await whatsappSettingsRepository.updateSettings(
      id,
      { is_active: false }
    )

    if (!updatedSettings) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: 'Failed to delete WhatsApp settings',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp settings deactivated successfully',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/settings/[id]' })

    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: errorMessage || 'Failed to delete WhatsApp settings',
        },
      },
      { status: 500 }
    )
  }
}

