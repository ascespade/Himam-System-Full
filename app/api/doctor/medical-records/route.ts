import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/medical-records
 * Get medical records for doctor's patients
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams
    const patientId = searchParams.get('patient_id')
    const recordType = searchParams.get('type')

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from('medical_records')
      .select(`
        id, patient_id, doctor_id, date, record_type, chief_complaint, diagnosis, treatment, notes, created_at, updated_at,
        patients (
          id,
          name
        )
      `)
      .eq('doctor_id', user.id)

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (recordType) {
      query = query.eq('record_type', recordType)
    }

    query = query.order('date', { ascending: false }).limit(50)

    const { data, error } = await query

    if (error) throw error

    const transformed = (data || []).map((item: Record<string, unknown>) => {
      const patients = item.patients as Record<string, unknown> | undefined
      return {
        ...item,
        title: item.chief_complaint || item.record_type, // Fallback title
        patient_name: patients?.name || 'غير معروف'
      }
    })

    return NextResponse.json({
      success: true,
      data: transformed
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/medical-records' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')
