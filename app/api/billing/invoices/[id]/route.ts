import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/billing/invoices/[id]
 * Get invoice details
 */
export const GET = withRateLimit(async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        patients (
          id,
          name,
          phone,
          email,
          address
        ),
        invoice_items (*)
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: invoice
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/billing/invoices/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'strict')

/**
 * PUT /api/billing/invoices/[id]
 * Update invoice status
 */
export const PUT = withRateLimit(async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await req.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Get current invoice to access total_amount
    const { data: currentInvoice } = await supabaseAdmin
      .from('invoices')
      .select('total_amount')
      .eq('id', params.id)
      .single()

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
      updateData.paid_amount = currentInvoice?.total_amount || 0
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        patients (
          id,
          name
        )
      `)
      .single()

    if (error) throw error

    // Create Notifications for payment
    if (status === 'paid' && data) {
      try {
        const { createNotification, createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
        
        const template = NotificationTemplates.paymentReceived(
          data.patients?.name || 'مريض',
          Number(data.total_amount) || 0
        )

        // Notify admin
        await createNotificationForRole('admin', {
          ...template,
          entityType: 'invoice',
          entityId: data.id
        })

        // Notify reception staff
        await createNotificationForRole('reception', {
          ...template,
          entityType: 'invoice',
          entityId: data.id
        })
      } catch (e) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Failed to create payment notifications', e, { invoiceId: params.id, endpoint: '/api/billing/invoices/[id]' })
      }
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/billing/invoices/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
