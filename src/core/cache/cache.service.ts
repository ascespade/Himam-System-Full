/**
 * Cache Service
 * Centralized caching with Redis (production) and in-memory (development)
 */

import { BaseService } from '@/core/services'

// ============================================================================
// Types
// ============================================================================

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

export interface CacheEntry<T> {
  data: T
  expiresAt: number
  tags?: string[]
}

// ============================================================================
// In-Memory Cache (Development)
// ============================================================================

class InMemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000
    this.cache.set(key, {
      data: value,
      expiresAt,
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async deleteByTag(tag: string): Promise<void> {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key)
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }
}

// ============================================================================
// Cache Service
// ============================================================================

export class CacheService extends BaseService {
  private cache: InMemoryCache

  constructor() {
    super()
    // Use in-memory cache for now
    // In production, this would use Redis
    this.cache = new InMemoryCache()
  }

  /**
   * Gets a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cache.get<T>(key)
    } catch (error) {
      // Cache errors should not break the app
      return null
    }
  }

  /**
   * Sets a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || 3600 // Default 1 hour
      await this.cache.set(key, value, ttl)
    } catch (error) {
      // Cache errors should not break the app
    }
  }

  /**
   * Deletes a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cache.delete(key)
    } catch (error) {
      // Cache errors should not break the app
    }
  }

  /**
   * Deletes all cache entries with a specific tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      await this.cache.deleteByTag(tag)
    } catch (error) {
      // Cache errors should not break the app
    }
  }

  /**
   * Clears all cache
   */
  async clear(): Promise<void> {
    try {
      await this.cache.clear()
    } catch (error) {
      // Cache errors should not break the app
    }
  }

  /**
   * Checks if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      return await this.cache.has(key)
    } catch (error) {
      return false
    }
  }

  /**
   * Gets or sets a value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    await this.set(key, value, options)
    return value
  }
}

// Export singleton instance
export const cacheService = new CacheService()
