/**
 * Rate Limiting Service
 * Provides rate limiting for API endpoints using Upstash Redis
 * Falls back gracefully if Redis is unavailable
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logWarn, logError } from '@/shared/utils/logger'

// Initialize Upstash Redis client
let redisClient: Redis | null = null
let isUpstashAvailable = false

/**
 * Initialize Upstash Redis client
 */
function initializeUpstashRedis(): void {
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!upstashUrl || !upstashToken) {
      logWarn('Upstash Redis not configured, rate limiting will be disabled', {
        hasUrl: !!upstashUrl,
        hasToken: !!upstashToken,
      })
      return
    }

    redisClient = new Redis({
      url: upstashUrl,
      token: upstashToken,
    })

    isUpstashAvailable = true
  } catch (error) {
    logError('Failed to initialize Upstash Redis', error)
    isUpstashAvailable = false
  }
}

// Initialize on module load
if (typeof window === 'undefined') {
  initializeUpstashRedis()
}

/**
 * API Rate Limiter
 * 100 requests per minute per identifier
 */
export const apiRateLimiter = isUpstashAvailable && redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null

/**
 * Auth Rate Limiter
 * 5 attempts per 15 minutes per identifier (for login/registration)
 */
export const authRateLimiter = isUpstashAvailable && redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    })
  : null

/**
 * Strict Rate Limiter
 * 10 requests per minute (for sensitive operations)
 */
export const strictRateLimiter = isUpstashAvailable && redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/strict',
    })
  : null

/**
 * Get identifier from request
 * Uses IP address or user ID if available
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID if available (more accurate)
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Apply rate limiting to a request
 * Returns true if request should proceed, false if rate limited
 */
export async function checkRateLimit(
  request: Request,
  limiter: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  // If rate limiting is not available, allow request
  if (!limiter) {
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    }
  }

  try {
    const result = await limiter.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    // On error, allow request but log warning
    logWarn('Rate limit check failed', { error, identifier })
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    }
  }
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'x-ratelimit-limit': limit.toString(),
    'x-ratelimit-remaining': remaining.toString(),
    'x-ratelimit-reset': reset.toString(),
  }
}
