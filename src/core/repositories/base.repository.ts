/**
 * Base Repository
 * Enterprise-grade repository pattern implementation
 * Provides common CRUD operations and query building
 */

import { supabaseAdmin } from '@/lib/supabase'
import { logError, logInfo } from '@/shared/utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface RepositoryOptions {
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
}

export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// Base Repository Class
// ============================================================================

/**
 * Base repository with common CRUD operations
 * All repositories should extend this class
 */
export abstract class BaseRepository<T extends Record<string, unknown>> {
  protected abstract readonly tableName: string
  protected abstract readonly selectFields: string

  /**
   * Get all records
   */
  async getAll(options?: RepositoryOptions): Promise<T[]> {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select(this.selectFields)

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        logError(`Error fetching all ${this.tableName}`, error)
        throw error
      }

      return (data || []) as unknown as T[]
    } catch (error) {
      logError(`Failed to get all ${this.tableName}`, error)
      throw error
    }
  }

  /**
   * Get record by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(this.selectFields)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        logError(`Error fetching ${this.tableName} by ID`, error)
        throw error
      }

      return data as unknown as T
    } catch (error) {
      logError(`Failed to get ${this.tableName} by ID`, error)
      throw error
    }
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const { data: created, error } = await supabaseAdmin
        .from(this.tableName)
        .insert(data)
        .select(this.selectFields)
        .single()

      if (error) {
        logError(`Error creating ${this.tableName}`, error)
        throw error
      }

      const createdData = created as unknown as { id: string }
      logInfo(`Created ${this.tableName}`, { id: createdData.id })
      return created as unknown as T
    } catch (error) {
      logError(`Failed to create ${this.tableName}`, error)
      throw error
    }
  }

  /**
   * Update record by ID
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: updated, error } = await supabaseAdmin
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select(this.selectFields)
        .single()

      if (error) {
        logError(`Error updating ${this.tableName}`, error)
        throw error
      }

      logInfo(`Updated ${this.tableName}`, { id })
      return updated as unknown as T
    } catch (error) {
      logError(`Failed to update ${this.tableName}`, error)
      throw error
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        logError(`Error deleting ${this.tableName}`, error)
        throw error
      }

      logInfo(`Deleted ${this.tableName}`, { id })
      return true
    } catch (error) {
      logError(`Failed to delete ${this.tableName}`, error)
      throw error
    }
  }

  /**
   * Get paginated results
   */
  async getPaginated(
    options: PaginationOptions = {},
    filters?: Record<string, unknown>
  ): Promise<PaginatedResult<T>> {
    try {
      const page = options.page || 1
      const limit = options.limit || 50
      const offset = (page - 1) * limit

      let query = supabaseAdmin
        .from(this.tableName)
        .select(this.selectFields, { count: 'exact' })

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        logError(`Error fetching paginated ${this.tableName}`, error)
        throw error
      }

      return {
        data: (data || []) as unknown as T[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      logError(`Failed to get paginated ${this.tableName}`, error)
      throw error
    }
  }

  /**
   * Count records
   */
  async count(filters?: Record<string, unknown>): Promise<number> {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { count, error } = await query

      if (error) {
        logError(`Error counting ${this.tableName}`, error)
        throw error
      }

      return count || 0
    } catch (error) {
      logError(`Failed to count ${this.tableName}`, error)
      throw error
    }
  }
}

