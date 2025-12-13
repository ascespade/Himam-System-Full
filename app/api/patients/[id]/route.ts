/**
 * Patient API Route - Individual Patient Operations
 * GET, PUT, DELETE operations for specific patient
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { applyRateLimitCheck, addRateLimitHeadersToResponse } from '@/core/api/middleware/applyRateLimit'

/**
 * GET /api/patients/:id
 * Get patient by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        errorResponse('Patient ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select('id, name, phone, email, nationality, date_of_birth, gender, address, status, allergies, chronic_diseases, emergency_contact, notes, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Patient not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }
      throw error
    }

    return NextResponse.json(successResponse(patient))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/patients/:id
 * Update patient
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = params
    const body = await req.json()

    if (!id) {
      return NextResponse.json(
        errorResponse('Patient ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Remove id from body if present
    const { id: _, ...updateData } = body

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, phone, email, nationality, date_of_birth, gender, address, status, allergies, chronic_diseases, emergency_contact, notes, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Patient not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }
      throw error
    }

    const response = NextResponse.json(successResponse(patient))
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/patients/:id
 * Delete patient (soft delete by setting status to inactive)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        errorResponse('Patient ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Soft delete by setting status to inactive
    const { error } = await supabaseAdmin
      .from('patients')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          errorResponse('Patient not found'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }
      throw error
    }

    const response = NextResponse.json(successResponse({ id, deleted: true }))
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
