/**
 * Bulk Messaging API
 * Send messages to multiple recipients
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { sendTextMessage, sendTemplateMessage } from '@/lib/whatsapp-messaging'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/bulk-send
 * Send bulk messages
 */
export async function POST(req: NextRequest) {
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

    if (!userData || (userData.role !== 'admin' && userData.role !== 'reception')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      recipients, // Array of phone numbers or patient IDs
      message_type, // 'text' or 'template'
      message_text,
      template_name,
      template_params, // For template messages
      filter_criteria, // Optional: filter patients by criteria
    } = body

    if (!recipients && !filter_criteria) {
      return NextResponse.json(
        { success: false, error: 'Recipients or filter criteria required' },
        { status: 400 }
      )
    }

    // Get recipient phone numbers
    let phoneNumbers: string[] = []

    if (recipients && recipients.length > 0) {
      // Check if recipients are phone numbers or patient IDs
      const isPhoneNumber = recipients[0].startsWith('+') || /^\d+$/.test(recipients[0])

      if (isPhoneNumber) {
        phoneNumbers = recipients
      } else {
        // Fetch phone numbers from patient IDs
        const { data: patients } = await supabaseAdmin
          .from('patients')
          .select('phone')
          .in('id', recipients)

        phoneNumbers = patients?.map((p) => p.phone).filter(Boolean) || []
      }
    } else if (filter_criteria) {
      // Filter patients by criteria
      let query = supabaseAdmin.from('patients').select('phone')

      if (filter_criteria.status) {
        query = query.eq('status', filter_criteria.status)
      }

      if (filter_criteria.has_appointment) {
        const { data: appointments } = await supabaseAdmin
          .from('appointments')
          .select('patient_id')
          .gte('date', new Date().toISOString())

        const patientIds = [...new Set(appointments?.map((a: Record<string, unknown>) => a.patient_id) || [])]
        query = query.in('id', patientIds)
      }

      const { data: patients } = await query
      phoneNumbers = patients?.map((p) => p.phone).filter(Boolean) || []
    }

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid phone numbers found' },
        { status: 400 }
      )
    }

    // Send messages with rate limiting (to avoid API limits)
    const results = {
      total: phoneNumbers.length,
      sent: 0,
      failed: 0,
      errors: [] as any[],
    }

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize)
      const batchPromises = batch.map(async (phone) => {
        try {
          if (message_type === 'template' && template_name) {
            await sendTemplateMessage(phone, template_name, 'ar', template_params || [])
          } else {
            await sendTextMessage(phone, message_text)
          }
          results.sent++
        } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

          results.failed++
          results.errors.push({ phone, error: errorMessage })
        }
      })

      await Promise.all(batchPromises)

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < phoneNumbers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Log bulk send activity
    await supabaseAdmin.from('activity_logs').insert({
      userId: user.id,
      userRole: userData.role,
      actionType: 'bulk_whatsapp_send',
      entityType: 'whatsapp_message',
      description: `تم إرسال ${results.sent} رسالة جماعية`,
      metadata: {
        total: results.total,
        sent: results.sent,
        failed: results.failed,
        message_type,
      },
    })

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/bulk-send' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

