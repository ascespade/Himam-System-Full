/**
 * Advanced Search API
 * Advanced search with filters for doctors
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/search
 * Advanced search with multiple filters
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
    const query = searchParams.get('q') || ''
    const entityType = searchParams.get('entity_type') // 'patient', 'session', 'record', 'treatment_plan'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const status = searchParams.get('status')
    const tags = searchParams.get('tags')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const results: Record<string, unknown> = {
      patients: [],
      sessions: [],
      medical_records: [],
      treatment_plans: [],
    }

    // Search patients
    if (!entityType || entityType === 'patient') {
      let patientQuery = supabaseAdmin
        .from('doctor_patient_relationships')
        .select(`
          patients (
            id,
            name,
            phone,
            date_of_birth,
            gender,
            status,
            created_at
          )
        `)
        .eq('doctor_id', user.id)
        .is('end_date', null)

      if (query) {
        patientQuery = patientQuery.or(`patients.name.ilike.%${query}%,patients.phone.ilike.%${query}%`)
      }

      const { data: patientRels } = await patientQuery
      results.patients = patientRels?.map((rel: Record<string, unknown>) => rel.patients).filter(Boolean) || []
    }

    // Search sessions
    if (!entityType || entityType === 'session') {
      let sessionQuery = supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('doctor_id', user.id)

      if (query) {
        sessionQuery = sessionQuery.or(`notes.ilike.%${query}%,session_type.ilike.%${query}%`)
      }

      if (dateFrom) {
        sessionQuery = sessionQuery.gte('date', dateFrom)
      }

      if (dateTo) {
        sessionQuery = sessionQuery.lte('date', dateTo)
      }

      if (status) {
        sessionQuery = sessionQuery.eq('status', status)
      }

      const { data: sessions } = await sessionQuery
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1)

      results.sessions = sessions || []
    }

    // Search medical records
    if (!entityType || entityType === 'record') {
      let recordQuery = supabaseAdmin
        .from('medical_records')
        .select('*')
        .eq('doctor_id', user.id)

      if (query) {
        recordQuery = recordQuery.or(`notes.ilike.%${query}%,description.ilike.%${query}%,record_type.ilike.%${query}%`)
      }

      if (dateFrom) {
        recordQuery = recordQuery.gte('created_at', dateFrom)
      }

      if (dateTo) {
        recordQuery = recordQuery.lte('created_at', dateTo)
      }

      const { data: records } = await recordQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      results.medical_records = records || []
    }

    // Search treatment plans
    if (!entityType || entityType === 'treatment_plan') {
      let planQuery = supabaseAdmin
        .from('treatment_plans')
        .select('*')
        .eq('doctor_id', user.id)

      if (query) {
        planQuery = planQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,goals.ilike.%${query}%`)
      }

      if (status) {
        planQuery = planQuery.eq('status', status)
      }

      if (tags && tags.length > 0) {
        planQuery = planQuery.overlaps('tags', tags)
      }

      const { data: plans } = await planQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      results.treatment_plans = plans || []
    }

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/search' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

