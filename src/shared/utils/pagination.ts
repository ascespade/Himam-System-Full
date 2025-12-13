/**
 * Pagination Utilities
 * Shared helpers for consistent pagination across the application
 */

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResult {
  page: number
  limit: number
  offset: number
  total?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Parse pagination parameters from request
 * Validates and provides defaults
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = 50,
  maxLimit = 100
): PaginationResult {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit)
  )
  const offset = (page - 1) * limit

  return {
    page,
    limit,
    offset,
  }
}

/**
 * Create pagination metadata from results
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page: number,
  limit: number,
  maxLimit = 100
): { isValid: boolean; error?: string } {
  if (page < 1) {
    return {
      isValid: false,
      error: 'Page must be greater than 0',
    }
  }

  if (limit < 1) {
    return {
      isValid: false,
      error: 'Limit must be greater than 0',
    }
  }

  if (limit > maxLimit) {
    return {
      isValid: false,
      error: `Limit cannot exceed ${maxLimit}`,
    }
  }

  return { isValid: true }
}
