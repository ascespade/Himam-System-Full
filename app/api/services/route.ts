/**
 * Services API Route
 * Manages service types with standardized error handling
 */

import { NextResponse } from 'next/server'
import { servicesRepository } from '@/infrastructure/supabase/repositories'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { logError } from '@/shared/utils/logger'

/**
 * GET /api/services
 * Get all active services
 */
export async function GET() {
  try {
    const services = await servicesRepository.getAll()

    return NextResponse.json(successResponse(services))
  } catch (error: unknown) {
    logError('Error fetching services', error)
    return NextResponse.json(
      errorResponse(error, 'FETCH_ERROR'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}



