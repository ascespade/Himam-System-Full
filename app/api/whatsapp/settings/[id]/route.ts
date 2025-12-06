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
      verify_token,
      access_token,
      phone_number_id,
      webhook_url,
      n8n_webhook_url,
      is_active,
    } = body

    // Build update object (only include provided fields)
    const updates: any = {}
    if (verify_token !== undefined) updates.verify_token = verify_token
    if (access_token !== undefined) updates.access_token = access_token
    if (phone_number_id !== undefined) updates.phone_number_id = phone_number_id
    if (webhook_url !== undefined) updates.webhook_url = webhook_url
    if (n8n_webhook_url !== undefined) updates.n8n_webhook_url = n8n_webhook_url
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
  } catch (error: any) {
    console.error('Error updating WhatsApp settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update WhatsApp settings',
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
  } catch (error: any) {
    console.error('Error deleting WhatsApp settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Failed to delete WhatsApp settings',
        },
      },
      { status: 500 }
    )
  }
}

