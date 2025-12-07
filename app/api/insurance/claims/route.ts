import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/insurance/claims
 * Get all insurance claims
 */
export async function GET(req: NextRequest) {
  try {
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

    const transformed = (data || []).map((item: any) => ({
      ...item,
      patient_name: item.patients?.name || 'غير معروف'
    }))

    return NextResponse.json({
      success: true,
      data: transformed
    })
  } catch (error: any) {
    console.error('Error fetching claims:', error)
    return NextResponse.json(
      { success: false, error: error.message },
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

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating claim:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

