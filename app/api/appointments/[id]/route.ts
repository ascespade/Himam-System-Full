/**
 * Appointment API Route - Individual Appointment Operations
 * GET, PUT, DELETE operations for specific appointment
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

/**
 * GET /api/appointments/:id
 * Get appointment by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        errorResponse('Appointment ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Appointment not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }
      throw error
    }

    return NextResponse.json(successResponse(appointment))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/appointments/:id
 * Update appointment
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()

    if (!id) {
      return NextResponse.json(
        errorResponse('Appointment ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Remove id from body if present
    const { id: _, ...updateData } = body

    // Validate date if provided
    if (updateData.date && updateData.time) {
      const appointmentDate = new Date(`${updateData.date}T${updateData.time}`)
      const now = new Date()
      if (appointmentDate < now) {
        return NextResponse.json(
          errorResponse('Cannot update appointment to past date'),
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Appointment not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }
      throw error
    }

    return NextResponse.json(successResponse(appointment))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/appointments/:id
 * Cancel appointment (soft delete by setting status to cancelled)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        errorResponse('Appointment ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Soft delete by setting status to cancelled
    const { error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Appointment not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }
      throw error
    }

    return NextResponse.json(successResponse({ id, cancelled: true }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
