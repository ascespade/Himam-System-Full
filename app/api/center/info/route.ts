import { NextResponse } from 'next/server'
import { centerInfoRepository } from '@/infrastructure/supabase/repositories'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

/**
 * GET /api/center/info
 * Get center information
 */
export const GET = withRateLimit(async function GET() {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch center information'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching center info', error, { endpoint: '/api/center/info' })
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    )
  }
}, 'api')



