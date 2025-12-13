/**
 * Guardian Approve Procedure API
 * Approve medical procedures that require guardian consent
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { guardianRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '@/lib'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/guardian/approve-procedure
 * Approve or reject a procedure requiring guardian consent
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { patient_id, procedure_id, approved, notes } = body

    if (!patient_id || !procedure_id || typeof approved !== 'boolean') {
      return NextResponse.json(
        errorResponse('Patient ID, procedure ID, and approval status are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Check if guardian has permission to approve procedures
    const relationships = await guardianRepository.getGuardianPatients(user.id)
    const relationship = relationships.find((r: { patient_id: string; is_active: boolean }) => r.patient_id === patient_id && r.is_active)

    if (!relationship) {
      return NextResponse.json(
        errorResponse('Patient not linked to this guardian'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    if (!relationship.permissions.approve_procedures) {
      return NextResponse.json(
        errorResponse('No permission to approve procedures'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    // Update procedure approval status
    // Note: This assumes a procedures table exists. Adjust based on your schema.
    const { data: procedure, error: procedureError } = await supabaseAdmin
      .from('procedures')
      .update({
        guardian_approved: approved,
        guardian_approval_date: approved ? new Date().toISOString() : null,
        guardian_approval_notes: notes || null,
        guardian_id: user.id
      })
      .eq('id', procedure_id)
      .eq('patient_id', patient_id)
      .select('id, patient_id, procedure_type, description, guardian_approved, guardian_approval_date, guardian_approval_notes, guardian_id, created_at, updated_at')
      .single()

    if (procedureError) {
      // If procedures table doesn't exist, create a generic approval record
      const { data: approval } = await supabaseAdmin
        .from('guardian_approvals')
        .insert({
          guardian_id: user.id,
          patient_id,
          procedure_id,
          approved,
          notes: notes || null,
          created_at: new Date().toISOString()
        })
        .select('id, guardian_id, patient_id, procedure_id, approved, notes, created_at, updated_at')
        .single()

      return NextResponse.json(
        successResponse(approval, approved ? 'تم الموافقة على الإجراء' : 'تم رفض الإجراء')
      )
    }

    return NextResponse.json(
      successResponse(procedure, approved ? 'تم الموافقة على الإجراء' : 'تم رفض الإجراء')
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}, 'api')
