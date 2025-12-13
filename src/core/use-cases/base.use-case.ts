/**
 * Base Use Case
 * Enterprise-grade use case pattern implementation
 * Encapsulates business logic and orchestrates services/repositories
 */

import { logError, logInfo } from '@/shared/utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface UseCaseResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: Record<string, unknown>
}

export interface UseCaseInput {
  [key: string]: unknown
}

// ============================================================================
// Base Use Case Class
// ============================================================================

/**
 * Base use case class with common patterns
 * All use cases should extend this class
 */
export abstract class BaseUseCase<TInput extends UseCaseInput, TOutput> {
  /**
   * Executes the use case
   */
  abstract execute(input: TInput): Promise<UseCaseResult<TOutput>>

  /**
   * Validates input
   */
  protected validateInput(input: TInput): UseCaseResult<TOutput> | null {
    // Override in subclasses for specific validation
    return null
  }

  /**
   * Handles errors consistently
   */
  protected handleError(error: unknown, context?: Record<string, unknown>): UseCaseResult<TOutput> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logError(`Use case error: ${this.constructor.name}`, error, context)
    
    return {
      success: false,
      error: errorMessage,
      code: 'USE_CASE_ERROR',
      details: context,
    }
  }

  /**
   * Creates success result
   */
  protected success(data: TOutput, details?: Record<string, unknown>): UseCaseResult<TOutput> {
    logInfo(`Use case success: ${this.constructor.name}`, details)
    return {
      success: true,
      data,
      details,
    }
  }

  /**
   * Creates failure result
   */
  protected failure(
    error: string,
    code?: string,
    details?: Record<string, unknown>
  ): UseCaseResult<TOutput> {
    return {
      success: false,
      error,
      code: code || 'USE_CASE_ERROR',
      details,
    }
  }
}

