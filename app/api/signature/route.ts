/**
 * Signature API Route
 * Handles digital signature storage and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { signature, patientName, sessionId, documentType } = body

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
    const fileName = `signatures/${Date.now()}-${patientName || 'anonymous'}-${sessionId || 'nosession'}.png`

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
    const { data: urlData } = supabaseAdmin.storage.from('documents').getPublicUrl(fileName)

    // Store signature metadata in database
    const { data: signatureRecord, error: dbError } = await supabaseAdmin
      .from('signatures')
      .insert({
        patient_name: patientName || 'Anonymous',
        session_id: sessionId,
        signature_url: urlData.publicUrl,
        document_type: documentType || 'consent',
      })
      .select('id, patient_name, session_id, signature_url, document_type, created_at, updated_at')
      .single()

    let signatureId: string | null = null
    if (dbError) {
      const { logError } = await import('@/shared/utils/logger')
      const record = signatureRecord as Record<string, unknown> | null
      if (record && typeof record === 'object' && record !== null && 'id' in record) {
        signatureId = record.id as string
      }
      logError('Error saving signature metadata', dbError, { signatureId, endpoint: '/api/signature' })
      // Still return success if storage worked
    } else {
      const record = signatureRecord as Record<string, unknown> | null
      if (record && typeof record === 'object' && record !== null && 'id' in record) {
        signatureId = record.id as string
      }
    }

    return NextResponse.json({
      success: true,
      signatureUrl: urlData.publicUrl,
      fileName,
      signatureId,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/signature' })

    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage || 'Failed to save signature',
      },
      { status: 500 }
    )
  }
}, 'api')

export const GET = withRateLimit(async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')
    const patientName = searchParams.get('patientName')

    let query = supabaseAdmin.from('signatures').select('id, patient_name, session_id, signature_url, document_type, created_at, updated_at').order('created_at', { ascending: false })

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    if (patientName) {
      query = query.ilike('patient_name', `%${patientName}%`)
    }

    const { data: signatures, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      signatures: signatures || [],
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/signature' })

    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage || 'Failed to fetch signatures',
      },
      { status: 500 }
    )
  }
}, 'api')
