import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'

/**
 * PUT /api/patients/[id] - Update a patient
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    const { data, error } = await supabaseAdmin
      .from('patients')
      .update({
        name: body.name,
        phone: body.phone,
        nationality: body.nationality,
        status: body.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(successResponse(data, 'تم تحديث المريض بنجاح'))
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/patients/[id] - Delete a patient
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json(successResponse(null, 'تم حذف المريض بنجاح'))
  } catch (error: any) {
    return handleApiError(error)
  }
}
