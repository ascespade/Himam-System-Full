/**
 * Readiness Check Endpoint
 * Checks if the service is ready to serve traffic
 * Returns 200 if all dependencies are healthy, 503 if degraded
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logError, logWarn } from '@/shared/utils/logger'

export const dynamic = 'force-dynamic'

interface HealthCheck {
  component: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
  error?: string
}

/**
 * GET /api/ready
 * Readiness probe - checks database, Redis, and external services
 */
export async function GET() {
  const checks: HealthCheck[] = []

  // Check database
  const dbCheck = await checkDatabase()
  checks.push(dbCheck)

  // Check Redis (if configured)
  const redisCheck = await checkRedis()
  if (redisCheck) {
    checks.push(redisCheck)
  }

  // Determine overall status
  const hasDown = checks.some((c) => c.status === 'down')
  const hasDegraded = checks.some((c) => c.status === 'degraded')
  const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy'

  const statusCode = overallStatus === 'healthy' ? 200 : 503

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  )
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  try {
    const start = Date.now()
    const { error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)

    const responseTime = Date.now() - start

    if (error) {
      logError('Database health check failed', error)
      return {
        component: 'database',
        status: 'down',
        error: error.message,
      }
    }

    // Consider degraded if response time > 1 second
    const status = responseTime > 1000 ? 'degraded' : 'healthy'

    return {
      component: 'database',
      status,
      responseTime,
    }
  } catch (error) {
    logError('Database health check exception', error)
    return {
      component: 'database',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<HealthCheck | null> {
  // Skip if Redis is not configured
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return null
  }

  try {
    const { Redis } = await import('@upstash/redis')

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })

    const start = Date.now()
    await redis.ping()
    const responseTime = Date.now() - start

    const status = responseTime > 500 ? 'degraded' : 'healthy'

    return {
      component: 'redis',
      status,
      responseTime,
    }
  } catch (error) {
    logWarn('Redis health check failed', { error })
    return {
      component: 'redis',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
