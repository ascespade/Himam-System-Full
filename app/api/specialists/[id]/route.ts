import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

/**
 * PUT /api/specialists/[id] - Update a specialist
 */
export const PUT = withRateLimit(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    return NextResponse.json(successResponse(data, 'تم تحديث الأخصائي بنجاح'))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}, 'api')

/**
 * DELETE /api/specialists/[id] - Delete a specialist
 */
export const DELETE = withRateLimit(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id} = params

    const { error } = await supabaseAdmin
      .from('specialists')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json(successResponse(null, 'تم حذف الأخصائي بنجاح'))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}, 'api')
