/**
 * POST /api/reception/insurance/request-approval
 * Request insurance approval before allowing patient to proceed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
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

    // Verify user is reception or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['reception', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const body = await req.json()
    const {
      patient_id,
      visit_id,
      session_id,
      insurance_provider,
      service_type,
      requested_amount,
      notes
    } = body

    // Validate
    if (!patient_id || !insurance_provider || !service_type || !requested_amount) {
      return NextResponse.json(
        errorResponse('Patient ID, insurance provider, service type, and amount are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Check if approval already exists
    const { data: existing } = await supabaseAdmin
      .from('insurance_approvals')
      .select('id, status')
      .eq('patient_id', patient_id)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing && existing.status === 'approved') {
      return NextResponse.json(
        errorResponse('موافقة تأمين موجودة بالفعل'),
        { status: HTTP_STATUS.CONFLICT }
      )
    }

    // Create approval request
    const { data: approval, error } = await supabaseAdmin
      .from('insurance_approvals')
      .insert({
        patient_id,
        visit_id: visit_id || null,
        session_id: session_id || null,
        insurance_provider,
        service_type,
        requested_amount,
        status: 'pending',
        notes: notes || null
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Integrate with insurance API to request approval
    // For now, we'll create a pending approval that can be manually approved

    return NextResponse.json(
      successResponse(approval, 'تم طلب الموافقة من التأمين'),
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
