import { NextResponse } from 'next/server'
import { centerInfoRepository } from '@/infrastructure/supabase/repositories'

/**
 * GET /api/center/info
 * Get center information
 */
export async function GET() {
  try {
    const centerInfo = await centerInfoRepository.getCenterInfo()

    if (!centerInfo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Center information not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: centerInfo,
    })
  } catch (error: any) {
    console.error('Error fetching center info:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch center information',
        },
      },
      { status: 500 }
    )
  }
}

