/**
 * Cron Job: Process Scheduled WhatsApp Messages
 * This should be called periodically (e.g., every minute) to send scheduled messages
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTextMessage, sendTemplateMessage } from '@/lib/whatsapp-messaging'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/whatsapp-scheduled
 * Process scheduled messages (called by cron job)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (optional, for security)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000) // Process messages scheduled within next 5 minutes

    // Get pending scheduled messages
    const { data: scheduledMessages, error } = await supabaseAdmin
      .from('whatsapp_scheduled_messages')
      .select('id, to_phone, message_type, content, template_name, scheduled_at, status, sent_at, created_by, created_at, updated_at')
      .eq('status', 'pending')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', fiveMinutesFromNow.toISOString())
      .order('scheduled_at', { ascending: true })

    if (error) throw error

    if (!scheduledMessages || scheduledMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled messages to process',
        processed: 0,
      })
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as Array<Record<string, unknown>>,
    }

    // Process each scheduled message
    for (const message of scheduledMessages) {
      try {
        // Check if it's time to send
        const scheduledTime = new Date(message.scheduled_at)
        if (scheduledTime > now) {
          // Not yet time, skip
          continue
        }

        // Send message
        if (message.message_type === 'template' && message.template_name) {
          await sendTemplateMessage(message.to_phone, message.template_name, 'ar', [])
        } else {
          await sendTextMessage(message.to_phone, message.content || '')
        }

        // Update status to sent
        await supabaseAdmin
          .from('whatsapp_scheduled_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', message.id)

        results.sent++
        results.processed++
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message'

        // Update status to failed
        await supabaseAdmin
          .from('whatsapp_scheduled_messages')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', message.id)

        results.failed++
        results.processed++
        results.errors.push({
          message_id: message.id,
          error: errorMessage,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} scheduled messages`,
      data: results,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/cron/whatsapp-scheduled' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

