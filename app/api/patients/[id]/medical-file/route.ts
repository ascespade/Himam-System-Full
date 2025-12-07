import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/patients/[id]/medical-file
 * Get comprehensive medical file for a patient
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get patient info
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', params.id)
      .single()

    if (patientError) throw patientError

    // Get medical records
    const { data: records, error: recordsError } = await supabaseAdmin
      .from('medical_records')
      .select('*')
      .eq('patient_id', params.id)
      .order('date', { ascending: false })

    // Get diagnoses
    const { data: diagnoses, error: diagnosesError } = await supabaseAdmin
      .from('diagnoses')
      .select('*')
      .eq('patient_id', params.id)
      .order('diagnosed_date', { ascending: false })

    // Get prescriptions
    const { data: prescriptions, error: prescriptionsError } = await supabaseAdmin
      .from('prescriptions')
      .select('*')
      .eq('patient_id', params.id)
      .order('prescribed_date', { ascending: false })

    // Get lab results
    const { data: labResults, error: labError } = await supabaseAdmin
      .from('lab_results')
      .select('*')
      .eq('patient_id', params.id)
      .order('performed_date', { ascending: false })

    // Get imaging results
    const { data: imagingResults, error: imagingError } = await supabaseAdmin
      .from('imaging_results')
      .select('*')
      .eq('patient_id', params.id)
      .order('performed_date', { ascending: false })

    // Get vital signs
    const { data: vitalSigns, error: vitalError } = await supabaseAdmin
      .from('vital_signs')
      .select('*')
      .eq('patient_id', params.id)
      .order('visit_date', { ascending: false })
      .limit(10)

    // Get doctor relationships
    const { data: doctors, error: doctorsError } = await supabaseAdmin
      .from('doctor_patient_relationships')
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .eq('patient_id', params.id)
      .is('end_date', null)

    return NextResponse.json({
      success: true,
      data: {
        patient,
        medical_records: records || [],
        diagnoses: diagnoses || [],
        prescriptions: prescriptions || [],
        lab_results: labResults || [],
        imaging_results: imagingResults || [],
        vital_signs: vitalSigns || [],
        doctors: (doctors || []).map((d: any) => ({
          ...d,
          doctor_name: d.users?.name
        }))
      }
    })
  } catch (error: any) {
    console.error('Error fetching medical file:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

