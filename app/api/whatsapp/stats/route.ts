/**
 * WhatsApp Stats API
 * Unified endpoint for getting WhatsApp statistics and status
 * Uses centralized WhatsApp status service
 */

/**
 * WhatsApp Stats API Route
 * Provides comprehensive WhatsApp statistics and status
 * Uses centralized status service for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { whatsappStatusService } from '@/shared/services/whatsapp-status.service'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { logError } from '@/shared/utils/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/stats
 * Get comprehensive WhatsApp statistics including status
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, options: CookieOptions) {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Use centralized status service
    const stats = await whatsappStatusService.getStats()

      return NextResponse.json(successResponse(stats))
  } catch (error: unknown) {
    logError('Error fetching WhatsApp stats', error)
    return NextResponse.json(
      errorResponse(error),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

