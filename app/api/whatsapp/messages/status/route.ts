/**
 * WhatsApp Message Status Webhook Handler
 * Handles status updates from Meta (sent, delivered, read)
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseRequestBody from '@/core/api/middleware'

export const dynamic = 'force-dynamic'

interface WhatsAppStatusWebhook {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
          conversation?: {
            id: string
            expiration_timestamp?: string
          }
          pricing?: {
            billable: boolean
            pricing_model: string
            category: string
          }
          errors?: Array<{
            code: number
            title: string
            message: string
          }>
        }>
        messages?: Array<{
          id: string
          from: string
          timestamp: string
          type: string
        }>
      }
      field: string
    }>
  }>
}

/**
 * POST /api/whatsapp/messages/status
 * Handle message status updates from Meta
 */
export async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody<WhatsAppStatusWebhook>(req)

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ success: false, error: 'Invalid webhook object' }, { status: 400 })
    }

    const entry = body.entry?.[0]
    if (!entry) {
      return NextResponse.json({ success: false, error: 'No entry found' }, { status: 400 })
    }

    const changes = entry.changes?.[0]
    if (!changes || changes.field !== 'messages') {
      return NextResponse.json({ success: false, error: 'Invalid webhook field' }, { status: 400 })
    }

    const statuses = changes.value?.statuses
    if (!statuses || statuses.length === 0) {
      return NextResponse.json({ success: true, message: 'No status updates' })
    }

    // Process each status update
    const updates = []
    for (const status of statuses) {
      const updateData: any = {
        status: status.status,
        updated_at: new Date().toISOString(),
      }

      if (status.status === 'delivered') {
        updateData.delivered_at = new Date(parseInt(status.timestamp) * 1000).toISOString()
      } else if (status.status === 'read') {
        updateData.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString()
      }

      // Update message in database
      const { data, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .update(updateData)
        .eq('message_id', status.id)
        .select()
        .single()

      if (error) {
        console.error(`Error updating message status for ${status.id}:`, error)
      } else if (data) {
        updates.push({ messageId: status.id, status: status.status })

        // If message is read, mark conversation as read
        if (status.status === 'read' && data.conversation_id) {
          await supabaseAdmin
            .from('whatsapp_conversations')
            .update({ unread_count: 0, updated_at: new Date().toISOString() })
            .eq('id', data.conversation_id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${updates.length} status updates`,
      updates,
    })
  } catch (error: any) {
    console.error('Error processing WhatsApp status webhook:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

