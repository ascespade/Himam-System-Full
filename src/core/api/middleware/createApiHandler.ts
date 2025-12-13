/**
 * Global API Handler Wrapper
 * Automatically applies rate limiting, error handling, and security measures
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, type RateLimitType } from './withRateLimit'
import { handleApiError } from '@/shared/utils/api'
import { logError } from '@/shared/utils/logger'

export interface ApiHandlerOptions {
  /**
   * Rate limit type: 'api' (default), 'auth', 'strict', or 'none'
   */
  rateLimit?: RateLimitType
  /**
   * Whether to require authentication
   */
  requireAuth?: boolean
  /**
   * Allowed HTTP methods
   */
  methods?: string[]
}

/**
 * Creates an API handler with automatic rate limiting and error handling
 * 
 * @example
 * ```typescript
 * export const GET = createApiHandler(async (req) => {
 *   // Your handler logic
 *   return NextResponse.json({ success: true, data: result })
 * })
 * ```
 */
export function createApiHandler<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse | Response>,
  options: ApiHandlerOptions = {}
): (req: NextRequest, ...args: T) => Promise<NextResponse | Response> {
  const {
    rateLimit = 'api',
    requireAuth = false,
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  } = options

  // Wrap with rate limiting
  const rateLimitedHandler = withRateLimit(
    async (req: NextRequest, ...args: T) => {
      // Check HTTP method
      const method = req.method
      if (!methods.includes(method)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Method not allowed',
            message: `Method ${method} is not allowed for this endpoint`,
          },
          { status: 405 }
        )
      }

      // Check authentication if required
      if (requireAuth) {
        // TODO: Add authentication check
        // For now, this is a placeholder
        const authHeader = req.headers.get('authorization')
        if (!authHeader) {
          return NextResponse.json(
            {
              success: false,
              error: 'Unauthorized',
              message: 'Authentication required',
            },
            { status: 401 }
          )
        }
      }

      try {
        // Execute handler
        return await handler(req, ...args)
      } catch (error) {
        // Handle errors
        logError('API handler error', error, {
          path: req.nextUrl.pathname,
          method: req.method,
        })
        return handleApiError(error)
      }
    },
    rateLimit
  )

  return rateLimitedHandler
}
