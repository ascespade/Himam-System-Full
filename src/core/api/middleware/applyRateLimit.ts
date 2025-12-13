/**
 * Helper to apply rate limiting to routes with params
 * For routes that have dynamic params, we need a different approach
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
import type { RateLimitType } from './withRateLimit'

/**
 * Apply rate limiting check and return response if rate limited
 * Returns null if request should proceed
 */
export async function applyRateLimitCheck(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<NextResponse | null> {
  // Skip rate limiting for webhooks
  const pathname = request.nextUrl.pathname
  const WEBHOOK_ROUTES = ['/api/whatsapp', '/api/slack/webhooks', '/api/cron']
  if (WEBHOOK_ROUTES.some((route) => pathname.startsWith(route))) {
    return null
  }

  // Skip if rate limiting is disabled
  if (type === 'none') {
    return null
  }

  // Select appropriate limiter
  let limiter = apiRateLimiter
  if (type === 'auth') {
    limiter = authRateLimiter
  } else if (type === 'strict') {
    limiter = strictRateLimiter
  }

  // Get identifier
  const identifier = getRateLimitIdentifier(request)

  // Check rate limit
  const result = await checkRateLimit(request, limiter, identifier)

  // If rate limited, return 429
  if (!result.success) {
    logWarn('Rate limit exceeded', {
      identifier,
      type,
      path: pathname,
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

  // Request allowed
  return null
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeadersToResponse(
  response: NextResponse,
  request: NextRequest,
  type: RateLimitType = 'api'
): void {
  const pathname = request.nextUrl.pathname
  const WEBHOOK_ROUTES = ['/api/whatsapp', '/api/slack/webhooks', '/api/cron']
  if (WEBHOOK_ROUTES.some((route) => pathname.startsWith(route))) {
    return
  }

  let limiter = apiRateLimiter
  if (type === 'auth') {
    limiter = authRateLimiter
  } else if (type === 'strict') {
    limiter = strictRateLimiter
  }

  if (!limiter) {
    return
  }

  const identifier = getRateLimitIdentifier(request)
  checkRateLimit(request, limiter, identifier).then((result) => {
    const headers = createRateLimitHeaders(
      result.limit,
      result.remaining,
      result.reset
    )
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  })
}
