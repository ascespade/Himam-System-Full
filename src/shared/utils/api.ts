/**
 * API Utility Functions
 * Standardized API response helpers and error handling
 */

import { ApiResponse, PaginatedResponse, AppError, ApiError } from '../types'
import { HTTP_STATUS } from '../constants'
import { getErrorMessage } from './index'
import { logError } from './logger'

// ============================================================================
// API Response Helpers
// ============================================================================

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}

/**
 * Creates an error API response
 */
export function errorResponse(
  error: string | Error | unknown,
  code?: string
): ApiResponse {
  return {
    success: false,
    error: getErrorMessage(error),
    ...(code && { code }),
  }
}

/**
 * Creates a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit)
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handles API errors and returns appropriate response
 */
export function handleApiError(error: unknown): Response {
  logError('API Error', error)
  
  let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
  let code: string | undefined
  let message = getErrorMessage(error)
  
  if (error instanceof ApiError) {
    status = error.statusCode
    code = error.code
    message = error.message
  } else if (error instanceof Error && 'statusCode' in error) {
    const appError = error as AppError
    status = appError.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    code = appError.code
  }
  
  return new Response(
    JSON.stringify(errorResponse(message, code)),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Validates request body
 */
export function validateRequestBody<T extends Record<string, unknown>>(
  body: unknown,
  requiredFields: (keyof T)[]
): { isValid: boolean; errors: string[]; data?: T } {
  const errors: string[] = []
  
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Request body must be an object'],
    }
  }
  
  const data = body as T
  
  for (const field of requiredFields) {
    const value = data[field]
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`Field '${String(field)}' is required`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    ...(errors.length === 0 && { data }),
  }
}

// ============================================================================
// Request Parsing
// ============================================================================

/**
 * Gets query parameter from URL
 */
export function getQueryParam(url: string, param: string): string | null {
  const urlObj = new URL(url)
  return urlObj.searchParams.get(param)
}

