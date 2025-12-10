/**
 * Base Service
 * Abstract base class for all service layers
 */

import { supabaseAdmin } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'
import { logError } from '@/shared/utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface ServiceError {
  message: string
  code?: string
  originalError?: unknown
}

export class ServiceException extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'ServiceException'
  }
}

// ============================================================================
// Base Service Class
// ============================================================================

export abstract class BaseService {
  protected supabase = supabaseAdmin

  /**
   * Handles Supabase errors and converts to ServiceException
   */
  protected handleError(error: PostgrestError | Error | unknown, context?: string): ServiceException {
    logError(`Service Error${context ? ` in ${context}` : ''}`, error)

    if (error instanceof ServiceException) {
      return error
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const pgError = error as PostgrestError
      return new ServiceException(
        pgError.message || 'Database operation failed',
        pgError.code,
        error
      )
    }

    if (error instanceof Error) {
      return new ServiceException(error.message, undefined, error)
    }

    return new ServiceException('An unknown error occurred', undefined, error)
  }

  /**
   * Validates that data exists
   */
  protected requireData<T>(data: T | null | undefined, errorMessage = 'Data not found'): T {
    if (!data) {
      throw new ServiceException(errorMessage, 'NOT_FOUND')
    }
    return data
  }

  /**
   * Validates required fields
   */
  protected validateRequired<T extends Record<string, unknown>>(
    data: T,
    fields: (keyof T)[]
  ): void {
    const missing: string[] = []
    
    for (const field of fields) {
      const value = data[field]
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        missing.push(String(field))
      }
    }

    if (missing.length > 0) {
      throw new ServiceException(
        `Missing required fields: ${missing.join(', ')}`,
        'VALIDATION_ERROR'
      )
    }
  }
}
