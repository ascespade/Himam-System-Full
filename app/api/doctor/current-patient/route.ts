/**
 * GET /api/doctor/current-patient
 * Get comprehensive data for current patient (from queue/visit)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, options: CookieOptions) {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get current patient visit
    let visit: any = null
    let patientId: string | null = null

    try {
      const visitResult = await supabaseAdmin
        .from('patient_visits')
        .select('*, patients (*), appointments (*)')
        .eq('doctor_id', user.id)
        .in('status', ['confirmed_to_doctor', 'with_doctor'])
        .order('confirmed_to_doctor_time', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (visitResult.data) {
        visit = visitResult.data
        patientId = visit.patient_id || visit.patients?.id
      }
    } catch (e: any) {
      // Table might not exist, try reception_queue
      try {
        const queueResult = await supabaseAdmin
          .from('reception_queue')
          .select('*, patients (*), appointments (*)')
          .eq('doctor_id', user.id)
          .in('status', ['confirmed', 'in_progress'])
          .order('confirmed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (queueResult.data) {
          visit = queueResult.data
          patientId = visit.patient_id || visit.patients?.id
        }
      } catch (e2) {
        // No current patient
      }
    }

    if (!patientId) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'لا يوجد مريض حالياً'
      })
    }

    // Fetch comprehensive patient data
    const [
      patientData,
      medicalRecords,
      treatmentPlans,
      appointments,
      vitalSigns,
      insuranceData,
      diagnoses,
      prescriptions
    ] = await Promise.all([
      // Patient basic info
      supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single(),

      // Medical records
      supabaseAdmin
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', user.id)
        .order('date', { ascending: false })
        .limit(20),

      // Treatment plans
      supabaseAdmin
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', user.id)
        .order('start_date', { ascending: false }),

      // Appointments
      supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .limit(10),

      // Vital signs (recent)
      supabaseAdmin
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false })
        .limit(10),

      // Insurance
      supabaseAdmin
        .from('patient_insurance')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .maybeSingle(),

      // Diagnoses
      supabaseAdmin
        .from('diagnoses')
        .select('*')
        .eq('patient_id', patientId)
        .order('diagnosed_date', { ascending: false })
        .limit(10),

      // Prescriptions
      supabaseAdmin
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescribed_date', { ascending: false })
        .limit(10)
    ])

    return NextResponse.json({
      success: true,
      data: {
        patient: patientData.data,
        visit: visit,
        medicalRecords: medicalRecords.data || [],
        treatmentPlans: treatmentPlans.data || [],
        appointments: appointments.data || [],
        vitalSigns: vitalSigns.data || [],
        insurance: insuranceData.data,
        diagnoses: diagnoses.data || [],
        prescriptions: prescriptions.data || []
      }
    })
  } catch (error: any) {
    console.error('Error fetching current patient:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

