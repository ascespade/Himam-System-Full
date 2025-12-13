/**
 * Redis Cache Manager
 * Provides caching functionality with TTL and invalidation
 */

import { Redis } from '@upstash/redis'
import { logWarn, logError, logInfo } from '@/shared/utils/logger'

let redisClient: Redis | null = null
let isRedisAvailable = false

/**
 * Initialize Redis client
 */
function initializeRedis(): void {
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!upstashUrl || !upstashToken) {
      logWarn('Redis not configured, caching will be disabled', {
        hasUrl: !!upstashUrl,
        hasToken: !!upstashToken,
      })
      return
    }

    redisClient = new Redis({
      url: upstashUrl,
      token: upstashToken,
    })

    isRedisAvailable = true
    logInfo('Redis cache initialized successfully')
  } catch (error) {
    logError('Failed to initialize Redis', error)
    isRedisAvailable = false
  }
}

// Initialize on module load (server-side only)
if (typeof window === 'undefined') {
  initializeRedis()
}

/**
 * Get cached value
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
  if (!isRedisAvailable || !redisClient) {
    return null
  }

  try {
    const value = await redisClient.get<T>(key)
    return value
  } catch (error) {
    logWarn('Cache get failed', { error, key: key.substring(0, 50) })
    return null
  }
}

/**
 * Set cached value with TTL
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 */
export async function setCache<T = unknown>(
  key: string,
  value: T,
  ttlSeconds = 300
): Promise<boolean> {
  if (!isRedisAvailable || !redisClient) {
    return false
  }

  try {
    await redisClient.setex(key, ttlSeconds, value)
    return true
  } catch (error) {
    logWarn('Cache set failed', { error, key: key.substring(0, 50) })
    return false
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!isRedisAvailable || !redisClient) {
    return false
  }

  try {
    await redisClient.del(key)
    return true
  } catch (error) {
    logWarn('Cache delete failed', { error, key: key.substring(0, 50) })
    return false
  }
}

/**
 * Delete multiple cached values by pattern
 */
export async function deleteCacheByPattern(pattern: string): Promise<number> {
  if (!isRedisAvailable || !redisClient) {
    return 0
  }

  try {
    // Note: Upstash Redis REST API doesn't support KEYS command
    // This is a simplified implementation
    // For production, consider using SCAN or maintaining a key registry
    logWarn('Pattern-based cache deletion not fully supported in Upstash REST API', { pattern })
    return 0
  } catch (error) {
    logWarn('Cache pattern delete failed', { error, pattern })
    return 0
  }
}

/**
 * Invalidate cache for a specific entity
 * Useful for cache invalidation on mutations
 */
export async function invalidateEntityCache(
  entityType: string,
  entityId?: string
): Promise<void> {
  if (!isRedisAvailable) {
    return
  }

  try {
    const patterns = [
      `${entityType}:${entityId || '*'}`,
      `${entityType}s:*`, // Plural form for list caches
    ]

    for (const pattern of patterns) {
      await deleteCacheByPattern(pattern)
    }
  } catch (error) {
    logWarn('Entity cache invalidation failed', { error, entityType, entityId })
  }
}

/**
 * Get or set cached value (cache-aside pattern)
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const value = await fetcher()

  // Set in cache (fire and forget)
  setCache(key, value, ttlSeconds).catch((error) => {
    logWarn('Failed to set cache after fetch', { error, key: key.substring(0, 50) })
  })

  return value
}

/**
 * Check if Redis is available
 */
export function isCacheAvailable(): boolean {
  return isRedisAvailable
}
