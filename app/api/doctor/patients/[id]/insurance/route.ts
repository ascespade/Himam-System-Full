/**
 * GET /api/doctor/patients/[id]/insurance
 * Get patient insurance information
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { applyRateLimitCheck, addRateLimitHeadersToResponse } from '@/core/api/middleware/applyRateLimit'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse
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

    // Get patient insurance - select specific columns
    const { data, error } = await supabaseAdmin
      .from('patient_insurance')
      .select('id, patient_id, insurance_company, policy_number, coverage_percentage, effective_date, expiry_date, is_active, notes, created_at, updated_at')
      .eq('patient_id', params.id)
      .eq('is_active', true)
      .order('effective_date', { ascending: false })

    if (error) {
      // Table might not exist
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: []
        })
      }
      throw error
    }

    const response = NextResponse.json({
      success: true,
      data: data || []
    })
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/patients/[id]/insurance' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

