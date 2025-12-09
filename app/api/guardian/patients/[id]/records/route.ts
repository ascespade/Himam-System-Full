/**
 * Guardian Patient Records API
 * Get patient records (limited based on permissions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { guardianRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/guardian/patients/[id]/records
 * Get patient records (limited based on guardian permissions)
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
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify user is guardian
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'guardian') {
      return NextResponse.json(
        errorResponse('Forbidden - Guardian access only'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    // Check if guardian has relationship with this patient
    const relationships = await guardianRepository.getGuardianPatients(user.id)
    const relationship = relationships.find((r: { patient_id: string; is_active: boolean }) => r.patient_id === params.id && r.is_active)

    if (!relationship) {
      return NextResponse.json(
        errorResponse('Patient not linked to this guardian'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    if (!relationship.permissions.view_records) {
      return NextResponse.json(
        errorResponse('No permission to view records'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    // Get limited records based on permissions
    const records: unknown[] = []

    // Get appointments if permission allows
    if (relationship.permissions.view_appointments) {
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('id, date, specialist, status, notes')
        .eq('phone', (await supabaseAdmin.from('patients').select('phone').eq('id', params.id).single()).data?.phone || '')
        .order('date', { ascending: false })
        .limit(50)

      if (appointments) {
        records.push(...appointments.map(a => ({ type: 'appointment', ...a })))
      }
    }

    // Get sessions (limited)
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('id, date, notes, created_at')
      .eq('patient_id', params.id)
      .order('date', { ascending: false })
      .limit(50)

    if (sessions) {
      records.push(...sessions.map(s => ({ type: 'session', ...s })))
    }

    return NextResponse.json(successResponse({
      records: records.sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime()
        const dateB = new Date(b.date || b.created_at || 0).getTime()
        return dateB - dateA
      }),
      permissions: relationship.permissions
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
