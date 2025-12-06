import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CRM_API_ENDPOINT = process.env.CRM_API_ENDPOINT
const CRM_API_KEY = process.env.CRM_API_KEY

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, patientId, sessionId, data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Sync with external CRM if configured
    if (CRM_API_ENDPOINT && CRM_API_KEY) {
      try {
        const crmResponse = await fetch(`${CRM_API_ENDPOINT}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CRM_API_KEY}`,
          },
          body: JSON.stringify({
            action,
            patientId,
            sessionId,
            data,
            timestamp: new Date().toISOString(),
          }),
        })

        if (!crmResponse.ok) {
          console.error('CRM sync failed:', await crmResponse.text())
        }
      } catch (crmError) {
        console.error('CRM API Error:', crmError)
        // Continue even if CRM sync fails
      }
    }

    // Update local database
    if (action === 'create_session' && patientId && data) {
      const { data: session, error } = await supabaseAdmin
        .from('sessions')
        .insert([
          {
            patient_id: patientId,
            specialist_id: data.specialistId,
            date: data.date,
            notes: data.notes,
          }
        ])
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        source: 'CRM',
        action,
        session,
        ok: true,
      })
    }

    // Trigger n8n workflow for CRM sync
    if (process.env.N8N_WEBHOOK_URL) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'crm_sync',
          action,
          patientId,
          sessionId,
          data,
        }),
      }).catch(console.error)
    }

    return NextResponse.json({
      source: 'CRM',
      action,
      ok: true,
    })
  } catch (error: any) {
    console.error('CRM API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync with CRM' },
      { status: 500 }
    )
  }
}
