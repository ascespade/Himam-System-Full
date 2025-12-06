/**
 * API Utility Functions
 * Standardized API response helpers and error handling
 */

import { ApiResponse, PaginatedResponse } from '../types'
import { HTTP_STATUS } from '../constants'
import { getErrorMessage } from './index'

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
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
  const message = getErrorMessage(error)
  const status = (error as any)?.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
  
  return new Response(
    JSON.stringify(errorResponse(message)),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Validates request body
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const field of requiredFields) {
    if (!body || body[field] === undefined || body[field] === null) {
      errors.push(`Field '${String(field)}' is required`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Request Parsing
// ============================================================================

/**
 * Safely parses JSON request body
 */
export async function parseRequestBody<T = any>(request: Request): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

/**
 * Gets query parameter from URL
 */
export function getQueryParam(url: string, param: string): string | null {
  const urlObj = new URL(url)
  return urlObj.searchParams.get(param)
}

