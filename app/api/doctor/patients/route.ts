import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/doctor/patients
 * Get patients assigned to the logged-in doctor
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
      .eq('doctor_id', user.id)
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
