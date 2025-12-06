import { NextResponse } from 'next/server'
import { servicesRepository } from '@/infrastructure/supabase/repositories'

/**
 * GET /api/services
 * Get all services
 */
export async function GET() {
  try {
    const services = await servicesRepository.getAll()

    return NextResponse.json({
      success: true,
      data: services,
    })
  } catch (error: any) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch services',
        },
      },
      { status: 500 }
    )
  }
}

