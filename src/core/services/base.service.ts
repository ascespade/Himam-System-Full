/**
 * Base Service
 * Enterprise-grade service layer pattern
 * Provides business logic abstraction over repositories
 */

import { logError, logInfo } from '@/shared/utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface PaginatedServiceResult<T> extends ServiceResult<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class ServiceException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'SERVICE_ERROR'
  ) {
    super(message)
    this.name = 'ServiceException'
    Object.setPrototypeOf(this, ServiceException.prototype)
  }
}

export interface ServiceError {
  message: string
  code: string
  details?: Record<string, unknown>
}

// ============================================================================
// Base Service Class
// ============================================================================

/**
 * Base service class with common business logic patterns
 * All services should extend this class
 */
export abstract class BaseService {
  /**
   * Wraps repository call with error handling
   */
  protected async execute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    context?: Record<string, unknown>
  ): Promise<ServiceResult<T>> {
    try {
      const data = await operation()
      return {
        success: true,
        data,
      }
    } catch (error: unknown) {
      logError(errorMessage, error, context)
      return {
        success: false,
        error: error instanceof Error ? error.message : errorMessage,
        code: 'SERVICE_ERROR',
      }
    }
  }

  /**
   * Validates input data
   */
  protected validateInput<T>(
    data: unknown,
    validator: (data: unknown) => data is T
  ): ServiceResult<T> {
    if (!validator(data)) {
      return {
        success: false,
        error: 'Invalid input data',
        code: 'VALIDATION_ERROR',
      }
    }
    return {
      success: true,
      data,
    }
  }

  /**
   * Logs service operation
   */
  protected logOperation(operation: string, context?: Record<string, unknown>): void {
    logInfo(`Service operation: ${operation}`, context)
  }
}
