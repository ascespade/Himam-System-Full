/**
 * GET /api/reception/insurance/check-approval
 * Check insurance approval status for patient
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

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
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        errorResponse('Patient ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Get latest approval
    const { data: approval, error } = await supabaseAdmin
      .from('insurance_approvals')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!approval) {
      return NextResponse.json(successResponse({
        hasApproval: false,
        status: 'none'
      }))
    }

    return NextResponse.json(successResponse({
      hasApproval: true,
      status: approval.status,
      approval: approval.status === 'approved' ? {
        approvalNumber: approval.approval_number,
        approvalDate: approval.approval_date,
        amount: approval.requested_amount
      } : null,
      pending: approval.status === 'pending',
      rejected: approval.status === 'rejected',
      rejectionReason: approval.rejection_reason
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
