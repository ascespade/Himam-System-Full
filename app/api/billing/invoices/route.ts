import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/billing/invoices
 * Get all invoices
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')
    const patientId = searchParams.get('patient_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const offset = (page - 1) * limit

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from('invoices')
      .select(`
        id, patient_id, invoice_number, subtotal, tax, discount, total, status, due_date, paid_at, notes, created_at, updated_at,
        patients (
          id,
          name,
          phone
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) throw error

    const transformed = (data || []).map((item: Record<string, unknown>) => {
      const patients = item.patients as Record<string, unknown> | undefined
      return {
        ...item,
        patient_name: patients?.name || 'غير معروف',
        patient_phone: patients?.phone || ''
      }
    })

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب الفواتير'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching invoices', error, { endpoint: '/api/billing/invoices' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'strict')

/**
 * POST /api/billing/invoices
 * Create new invoice
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
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
    const {
      patient_id,
      items,
      discount = 0,
      tax_rate = 0.15, // 15% VAT default
      notes
    } = body

    if (!patient_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: Record<string, unknown>) => {
      const price = typeof item.price === 'number' ? item.price : 0
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0
      return sum + (price * quantity)
    }, 0)
    const tax = (subtotal - discount) * tax_rate
    const total = subtotal - discount + tax

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // 1. Create Invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        patient_id,
        invoice_number: invoiceNumber,
        subtotal,
        tax,
        discount,
        total,
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
        notes
      })
      .select('id, patient_id, invoice_number, subtotal, tax, discount, total, status, due_date, paid_at, notes, created_at, updated_at')
      .single()

    if (invoiceError) throw invoiceError

    // 2. Create Invoice Items
    const invoiceItems = items.map((item: Record<string, unknown>) => {
      const price = typeof item.price === 'number' ? item.price : 0
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0
      return {
        invoice_id: invoice.id,
        description: item.description,
        quantity,
        unit_price: price,
        total_price: price * quantity
      }
    })

    const { error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) throw itemsError

    // Create Notifications
    try {
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('name')
        .eq('id', patient_id)
        .single()

      const { createNotification, createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
      
      const template = NotificationTemplates.invoiceCreated(
        patient?.name || 'مريض',
        total
      )

      // Notify admin
      await createNotificationForRole('admin', {
        ...template,
        entityType: 'invoice',
        entityId: invoice.id
      })

      // Notify reception staff
      await createNotificationForRole('reception', {
        ...template,
        entityType: 'invoice',
        entityId: invoice.id
      })
    } catch (e: unknown) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to create notifications', e, { invoiceId: invoice.id })
    }

    // Audit Log
    try {
      const { logAudit } = await import('@/lib/audit')
      await logAudit(user.id, 'create_invoice', 'invoice', invoice.id, { patient_id, total, invoice_number: invoiceNumber }, req)
    } catch (e: unknown) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to log audit', e, { invoiceId: invoice.id, userId: user.id })
    }

    return NextResponse.json({
      success: true,
      data: invoice
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الفاتورة'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error creating invoice', error, { endpoint: '/api/billing/invoices' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'strict')
