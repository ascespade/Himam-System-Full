import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'

/**
 * PUT /api/specialists/[id] - Update a specialist
 */
export async function PUT(
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
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(successResponse(data, 'تم تحديث الأخصائي بنجاح'))
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
}
