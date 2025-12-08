import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/patients
 * Get patients assigned to the logged-in doctor
 * Supports:
 * - ?search=query - Search by name or phone
 * - ?recent=true - Get recently accessed patients
 * - ?active=true - Get patients with active treatment plans or recent sessions
 */
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

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const recent = searchParams.get('recent') === 'true'
    const active = searchParams.get('active') === 'true'

    let query = supabaseAdmin
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
      .eq('doctor_id', user.id)
      .is('end_date', null)

    // Search functionality
    if (search && search.length >= 2) {
      // Search in patients table by name or phone
      const { data: searchResults, error: searchError } = await supabaseAdmin
        .from('patients')
        .select('id, name, phone, date_of_birth, gender, blood_type, allergies, chronic_diseases')
        .or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
        .limit(20)

      if (searchError) throw searchError

      // Filter to only patients assigned to this doctor
      const { data: relationships } = await supabaseAdmin
        .from('doctor_patient_relationships')
        .select('patient_id')
        .eq('doctor_id', user.id)
        .is('end_date', null)

      const assignedPatientIds = new Set((relationships || []).map((r: any) => r.patient_id))
      const filteredResults = (searchResults || []).filter((p: any) => assignedPatientIds.has(p.id))

      // Enrich with additional data
      const enrichedResults = await Promise.all(
        filteredResults.map(async (patient: any) => {
          const [lastSession, activePlans, nextAppointment] = await Promise.all([
            supabaseAdmin
              .from('sessions')
              .select('date')
              .eq('patient_id', patient.id)
              .eq('doctor_id', user.id)
              .order('date', { ascending: false })
              .limit(1)
              .single(),
            supabaseAdmin
              .from('treatment_plans')
              .select('id', { count: 'exact', head: true })
              .eq('patient_id', patient.id)
              .eq('doctor_id', user.id)
              .eq('status', 'active'),
            supabaseAdmin
              .from('appointments')
              .select('date')
              .eq('patient_id', patient.id)
              .eq('doctor_id', user.id)
              .gte('date', new Date().toISOString())
              .order('date', { ascending: true })
              .limit(1)
              .single()
          ])

          return {
            ...patient,
            last_visit: lastSession.data?.date || null,
            active_treatment_plans: activePlans.count || 0,
            next_appointment: nextAppointment.data?.date || null
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: enrichedResults
      })
    }

    // Recent patients (patients with sessions in last 30 days)
    if (recent) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentSessions } = await supabaseAdmin
        .from('sessions')
        .select('patient_id')
        .eq('doctor_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: false })

      const recentPatientIds = [...new Set((recentSessions || []).map((s: any) => s.patient_id))]

      if (recentPatientIds.length === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      const { data, error } = await supabaseAdmin
        .from('patients')
        .select('id, name, phone, date_of_birth, gender, blood_type, allergies, chronic_diseases')
        .in('id', recentPatientIds)
        .limit(10)

      if (error) throw error

      return NextResponse.json({
        success: true,
        data: data || []
      })
    }

    // Active patients (with active treatment plans or recent sessions)
    if (active) {
      const { data: activePlans } = await supabaseAdmin
        .from('treatment_plans')
        .select('patient_id')
        .eq('doctor_id', user.id)
        .eq('status', 'active')

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentSessions } = await supabaseAdmin
        .from('sessions')
        .select('patient_id')
        .eq('doctor_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString())

      const activePatientIds = new Set([
        ...(activePlans || []).map((p: any) => p.patient_id),
        ...(recentSessions || []).map((s: any) => s.patient_id)
      ])

      if (activePatientIds.size === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      const { data, error } = await supabaseAdmin
        .from('patients')
        .select('id, name, phone, date_of_birth, gender, blood_type, allergies, chronic_diseases')
        .in('id', Array.from(activePatientIds))
        .limit(20)

      if (error) throw error

      return NextResponse.json({
        success: true,
        data: data || []
      })
    }

    // Default: all assigned patients
    const { data, error } = await query

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
