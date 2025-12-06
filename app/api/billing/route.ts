/**
 * Billing API Route
 * Handles billing records and invoice management
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { getSettings } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { patientName, phone, amount, notes, invoiceNumber } = body

    if (!patientName || !amount) {
      return NextResponse.json(
        { error: 'Patient name and amount are required' },
        { status: 400 }
      )
    }

    // Create billing record
    const { data: billing, error } = await supabaseAdmin
      .from('billing')
      .insert({
        patient_name: patientName,
        phone,
        amount: parseFloat(amount.toString()),
        paid: false,
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
        notes,
      })
      .select()
      .single()

    if (error) throw error

    // Sync with CRM if configured
    const settings = await getSettings()
    if (settings.CRM_URL && settings.CRM_TOKEN) {
      try {
        await fetch(`${settings.CRM_URL}/billing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.CRM_TOKEN}`,
          },
          body: JSON.stringify({
            action: 'create_invoice',
            billingId: billing.id,
            patientName,
            amount,
            invoiceNumber: billing.invoice_number,
          }),
        }).catch(console.error)
      } catch (crmError) {
        console.error('CRM billing sync error:', crmError)
        // Non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      billing,
    })
  } catch (error: any) {
    console.error('Billing API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create billing record',
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, paid, amount, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Billing ID is required' }, { status: 400 })
    }

    const updates: any = {}
    if (paid !== undefined) updates.paid = paid
    if (amount !== undefined) updates.amount = parseFloat(amount.toString())
    if (notes !== undefined) updates.notes = notes

    const { data: billing, error } = await supabaseAdmin
      .from('billing')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      billing,
    })
  } catch (error: any) {
    console.error('Billing update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update billing record',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const patientName = searchParams.get('patientName')
    const paid = searchParams.get('paid')

    let query = supabaseAdmin.from('billing').select('*').order('created_at', { ascending: false })

    if (patientName) {
      query = query.ilike('patient_name', `%${patientName}%`)
    }

    if (paid !== null) {
      query = query.eq('paid', paid === 'true')
    }

    const { data: billing, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      billing: billing || [],
    })
  } catch (error: any) {
    console.error('Billing GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch billing records',
      },
      { status: 500 }
    )
  }
}



