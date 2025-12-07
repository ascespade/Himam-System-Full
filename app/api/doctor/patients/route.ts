import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/doctor/patients
 * Get patients assigned to the logged-in doctor
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Get doctor_id from auth session
    // For now, get all patients with doctor relationships
    const { data, error } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select(`
        patient_id,
        patients (
          id,
          name,
          phone,
          date_of_birth,
          gender,
          blood_type,
          allergies,
          chronic_diseases
        )
      `)
      .eq('relationship_type', 'primary')
      .is('end_date', null)

    if (error) throw error

    const patients = (data || []).map((item: any) => item.patients).filter(Boolean)

    return NextResponse.json({
      success: true,
      data: patients
    })
  } catch (error: any) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

