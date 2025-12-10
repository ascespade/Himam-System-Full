/**
 * Webhook Test Endpoint
 * Test if webhook is properly configured and receiving requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const settings = await whatsappSettingsRepository.getActiveSettings()
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'No active WhatsApp settings found',
        webhookUrl: null,
      })
    }

    const webhookUrl = settings.webhook_url || `https://${req.headers.get('host')}/api/whatsapp`

    return NextResponse.json({
      success: true,
      webhookUrl,
      verifyToken: settings.verify_token ? '✅ Configured' : '❌ Missing',
      accessToken: settings.access_token ? '✅ Configured' : '❌ Missing',
      phoneNumberId: settings.phone_number_id ? '✅ Configured' : '❌ Missing',
      isActive: settings.is_active,
      instructions: {
        step1: 'Go to Meta Developer Console → WhatsApp → Configuration → Webhooks',
        step2: `Set Callback URL to: ${webhookUrl}`,
        step3: `Set Verify Token to: ${settings.verify_token || 'YOUR_VERIFY_TOKEN'}`,
        step4: 'Subscribe to: messages and message_status',
        step5: 'Click "Verify and Save"',
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

