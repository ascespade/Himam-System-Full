import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { applyRateLimitCheck, addRateLimitHeadersToResponse } from '@/core/api/middleware/applyRateLimit'

/**
 * PUT /api/specialists/[id] - Update a specialist
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(request, 'api')
  if (rateLimitResponse) return rateLimitResponse
  try {
    const body = await request.json()
    const { id } = params

    const { data, error } = await supabaseAdmin
      .from('specialists')
      .update({
        name: body.name,
        specialty: body.specialty,
        nationality: body.nationality,
        email: body.email,
      })
      .eq('id', id)
      .select('id, name, specialty, nationality, email, phone, created_at, updated_at')
      .single()

    if (error) throw error

    const response = NextResponse.json(successResponse(data, 'تم تحديث الأخصائي بنجاح'))
    addRateLimitHeadersToResponse(response, request, 'api')
    return response
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/specialists/[id] - Delete a specialist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(request, 'api')
  if (rateLimitResponse) return rateLimitResponse
  try {
    const { id} = params

    const { error } = await supabaseAdmin
      .from('specialists')
      .delete()
      .eq('id', id)

    if (error) throw error

    const response = NextResponse.json(successResponse(null, 'تم حذف الأخصائي بنجاح'))
    addRateLimitHeadersToResponse(response, request, 'api')
    return response
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
