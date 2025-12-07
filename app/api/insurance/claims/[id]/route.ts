import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * PUT /api/insurance/claims/[id]
 * Update insurance claim status
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { status, rejection_reason } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved' || status === 'paid') {
      updateData.processed_date = new Date().toISOString()
    }

    if (rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data, error } = await supabaseAdmin
      .from('insurance_claims')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error updating claim:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

