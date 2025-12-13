import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/insurance/claims
 * Get all insurance claims
 */
export async function GET(req: NextRequest) {
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
    const provider = searchParams.get('provider')

    let query = supabaseAdmin
      .from('insurance_claims')
      .select(`
        *,
        patients (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (provider && provider !== 'all') {
      query = query.eq('insurance_provider', provider)
    }

    const { data, error } = await query

    if (error) throw error

    const transformed = (data || []).map((item: Record<string, unknown>) => {
      const patients = item.patients as Record<string, unknown> | undefined
      return {
        ...item,
        patient_name: patients?.name || 'غير معروف'
      }
    })

    return NextResponse.json({
      success: true,
      data: transformed
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/insurance/claims' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/insurance/claims
 * Create new insurance claim
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

    const body = await req.json()
    const {
      patient_id,
      claim_type,
      service_date,
      service_description,
      amount,
      insurance_provider
    } = body

    if (!patient_id || !claim_type || !service_date || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate claim number
    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Calculate covered amount (default 80% for now, can be customized)
    const coveredAmount = amount * 0.8
    const patientResponsibility = amount - coveredAmount

    const { data, error } = await supabaseAdmin
      .from('insurance_claims')
      .insert({
        patient_id,
        claim_number: claimNumber,
        claim_type,
        service_date,
        service_description: service_description || '',
        amount,
        covered_amount: coveredAmount,
        patient_responsibility: patientResponsibility,
        insurance_provider: insurance_provider || '',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Create Notifications
    try {
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('name')
        .eq('id', patient_id)
        .single()

      const { createNotification, createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
      
      const template = NotificationTemplates.insuranceClaimSubmitted(
        patient?.name || 'مريض',
        amount
      )

      // Notify admin
      await createNotificationForRole('admin', {
        ...template,
        entityType: 'insurance_claim',
        entityId: data.id
      })

      // Notify insurance staff
      await createNotificationForRole('insurance', {
        ...template,
        entityType: 'insurance_claim',
        entityId: data.id
      })
    } catch (e) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to create notifications', e, { claimId: data.id, endpoint: '/api/insurance/claims' })
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/insurance/claims' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

