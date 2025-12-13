/**
 * Rate Limiting Middleware
 * Applies rate limiting to API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  apiRateLimiter,
  authRateLimiter,
  strictRateLimiter,
  getRateLimitIdentifier,
  checkRateLimit,
  createRateLimitHeaders,
} from '@/core/security/rateLimit'
import { logWarn } from '@/shared/utils/logger'

export type RateLimitType = 'api' | 'auth' | 'strict' | 'none'

/**
 * Rate limit configuration for routes
 */
export interface RateLimitConfig {
  type: RateLimitType
  getUserId?: (request: NextRequest) => Promise<string | undefined>
}

/**
 * Apply rate limiting to a request
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  // Skip rate limiting if disabled
  if (config.type === 'none') {
    return null
  }

  // Select appropriate limiter
  let limiter = apiRateLimiter
  if (config.type === 'auth') {
    limiter = authRateLimiter
  } else if (config.type === 'strict') {
    limiter = strictRateLimiter
  }

  // Get identifier
  const userId = config.getUserId ? await config.getUserId(request) : undefined
  const identifier = getRateLimitIdentifier(request, userId)

  // Check rate limit
  const result = await checkRateLimit(request, limiter, identifier)

  // If rate limited, return 429
  if (!result.success) {
    logWarn('Rate limit exceeded', {
      identifier,
      type: config.type,
      path: request.nextUrl.pathname,
    })

    const headers = createRateLimitHeaders(
      result.limit,
      result.remaining,
      result.reset
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      {
        status: 429,
        headers,
      }
    )
  }

  // Request allowed, return null to continue
  return null
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): void {
  const headers = createRateLimitHeaders(limit, remaining, reset)
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}
