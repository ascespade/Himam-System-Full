import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Patients API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, nationality, status = 'Pending' } = body

    if (!name || !phone || !nationality) {
      return NextResponse.json(
        { error: 'Name, phone, and nationality are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert([
        {
          name,
          phone,
          nationality,
          status,
        }
      ])
      .select()
      .single()

    if (error) throw error

    // Optionally trigger n8n webhook for booking workflow
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'patient_created',
          patient: data,
        }),
      }).catch(console.error)
    }

    return NextResponse.json({ data, ok: true })
  } catch (error: any) {
    console.error('Patients API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create patient' },
      { status: 500 }
    )
  }
}
