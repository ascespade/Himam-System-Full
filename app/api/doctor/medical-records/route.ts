import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/doctor/medical-records
 * Get medical records for doctor's patients
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Get doctor_id from auth session
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patient_id')
    const recordType = searchParams.get('type')

    let query = supabaseAdmin
      .from('medical_records')
      .select(`
        *,
        patients (
          id,
          name
        )
      `)

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (recordType) {
      query = query.eq('record_type', recordType)
    }

    query = query.order('date', { ascending: false }).limit(50)

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
    console.error('Error fetching medical records:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

