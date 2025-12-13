/**
 * Rate Limit Wrapper for API Routes
 * Automatically applies rate limiting to route handlers
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
 * Webhook routes that should skip rate limiting
 * These are verified via signature/header validation
 */
const WEBHOOK_ROUTES = [
  '/api/whatsapp', // WhatsApp webhook
  '/api/slack/webhooks', // Slack webhooks
  '/api/cron', // Cron jobs
]

/**
 * Check if route is a webhook
 */
function isWebhookRoute(pathname: string): boolean {
  return WEBHOOK_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Wrapper to apply rate limiting to API route handlers
 */
export function withRateLimit<T extends (req: NextRequest, ...args: unknown[]) => Promise<Response | NextResponse>>(
  handler: T,
  type: RateLimitType = 'api'
): T {
  return (async (req: NextRequest, ...args: unknown[]) => {
    // Skip rate limiting for webhooks
    if (isWebhookRoute(req.nextUrl.pathname)) {
      return handler(req, ...args)
    }

    // Skip if rate limiting is disabled
    if (type === 'none') {
      return handler(req, ...args)
    }

    // Select appropriate limiter
    let limiter = apiRateLimiter
    if (type === 'auth') {
      limiter = authRateLimiter
    } else if (type === 'strict') {
      limiter = strictRateLimiter
    }

    // Get identifier
    const identifier = getRateLimitIdentifier(req)

    // Check rate limit
    const result = await checkRateLimit(req, limiter, identifier)

    // If rate limited, return 429
    if (!result.success) {
      logWarn('Rate limit exceeded', {
        identifier,
        type,
        path: req.nextUrl.pathname,
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

    // Execute handler
    const response = await handler(req, ...args)

    // Add rate limit headers to response
    const rateLimitHeaders = createRateLimitHeaders(
      result.limit,
      result.remaining,
      result.reset
    )
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }) as T
}
