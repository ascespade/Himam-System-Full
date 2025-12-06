import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { signature, patientId, documentId, documentType } = body

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      )
    }

    // Convert base64 to buffer
    const base64Data = signature.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Supabase Storage
    const fileName = `signatures/${Date.now()}-${patientId || 'anonymous'}.png`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName)

    // Store signature metadata in database (you might want to create a signatures table)
    // For now, we'll just return success

    // Trigger n8n workflow for signature processing
    if (process.env.N8N_WEBHOOK_URL) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'signature_received',
          patientId,
          documentId,
          documentType,
          signatureUrl: urlData.publicUrl,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error)
    }

    return NextResponse.json({
      source: 'Signature',
      signatureUrl: urlData.publicUrl,
      fileName,
      ok: true,
    })
  } catch (error: any) {
    console.error('Signature API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save signature' },
      { status: 500 }
    )
  }
}
