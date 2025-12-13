/**
 * Redis Client with Fallback
 * Provides caching with graceful degradation
 */

let redisClient: any = null
let isRedisAvailable = false

/**
 * Initialize Redis client
 */
async function initializeRedis(): Promise<void> {
  try {
    const Redis = require('ioredis')
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL

    if (!redisUrl) {
      console.warn('Redis URL not configured, using in-memory fallback')
      return
    }

    redisClient = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3
    })

    // Test connection
    await redisClient.ping()
    isRedisAvailable = true
    // Redis connected successfully (logged via logger if needed)
  } catch (error) {
    console.warn('Redis not available, using in-memory fallback:', error)
    isRedisAvailable = false
    redisClient = null
  }
}

// In-memory cache fallback
const memoryCache = new Map<string, { value: unknown; expires: number }>()

/**
 * Get value from cache
 */
export async function getCache(key: string): Promise<unknown | null> {
  if (!redisClient && !isRedisAvailable) {
    await initializeRedis()
  }

  try {
    if (isRedisAvailable && redisClient) {
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } else {
      // Use memory cache
      const cached = memoryCache.get(key)
      if (cached && cached.expires > Date.now()) {
        return cached.value
      }
      memoryCache.delete(key)
      return null
    }
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set value in cache
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<boolean> {
  if (!redisClient && !isRedisAvailable) {
    await initializeRedis()
  }

  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } else {
      // Use memory cache
      memoryCache.set(key, {
        value,
        expires: Date.now() + ttlSeconds * 1000
      })
      return true
    }
  } catch (error) {
    console.error('Cache set error:', error)
    return false
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.del(key)
      return true
    } else {
      memoryCache.delete(key)
      return true
    }
  } catch (error) {
    console.error('Cache delete error:', error)
    return false
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearCache(pattern?: string): Promise<boolean> {
  try {
    if (isRedisAvailable && redisClient) {
      if (pattern) {
        const keys = await redisClient.keys(pattern)
        if (keys.length > 0) {
          await redisClient.del(...keys)
        }
      } else {
        await redisClient.flushdb()
      }
      return true
    } else {
      if (pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'))
        for (const key of memoryCache.keys()) {
          if (regex.test(key)) {
            memoryCache.delete(key)
          }
        }
      } else {
        memoryCache.clear()
      }
      return true
    }
  } catch (error) {
    console.error('Cache clear error:', error)
    return false
  }
}

// Initialize on module load
if (typeof window === 'undefined') {
  initializeRedis()
}
