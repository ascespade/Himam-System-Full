import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/patients/[id]/insurance
 * Get patient's insurance information
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user is doctor and has access to this patient
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role === 'doctor') {
      // Verify doctor has appointments with this patient
      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('patient_id', params.id)
        .eq('doctor_id', user.id)
        .limit(1)
        .single()

      if (!appointment) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    } else if (userData?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('patient_insurance')
      .select('*')
      .eq('patient_id', params.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب معلومات التأمين'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching insurance', error, { endpoint: '/api/patients/[id]/insurance', patientId: params.id })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/patients/[id]/insurance
 * Add insurance information for patient
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Only admin can add insurance
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { insurance_company, policy_number, member_id, group_number, coverage_type, coverage_percentage, copay_amount, deductible, max_coverage, effective_date, expiry_date, notes } = body

    if (!insurance_company || !policy_number) {
      return NextResponse.json({ success: false, error: 'Insurance company and policy number are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('patient_insurance')
      .insert({
        patient_id: params.id,
        insurance_company,
        policy_number,
        member_id: member_id || null,
        group_number: group_number || null,
        coverage_type: coverage_type || 'primary',
        coverage_percentage: coverage_percentage || 100,
        copay_amount: copay_amount || 0,
        deductible: deductible || 0,
        max_coverage: max_coverage || null,
        effective_date: effective_date || null,
        expiry_date: expiry_date || null,
        is_active: true,
        notes: notes || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة معلومات التأمين'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error adding insurance', error, { endpoint: '/api/patients/[id]/insurance', patientId: params.id })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

