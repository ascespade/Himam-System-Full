/**
 * Base API Handler
 * Enterprise-grade API route handler with standardized patterns
 * Provides authentication, validation, error handling, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, authenticateRequest, type ApiContext, type ApiHandler } from './middleware'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { logError, logInfo } from '@/shared/utils/logger'
import type { UserRole } from './middleware'

// ============================================================================
// Types
// ============================================================================

export interface BaseHandlerOptions {
  requireAuth?: boolean
  requireRoles?: UserRole[]
  validateBody?: boolean
  requiredFields?: string[]
}

// ============================================================================
// Base Handler Factory
// ============================================================================

/**
 * Creates a standardized API handler with built-in:
 * - Authentication & Authorization
 * - Request validation
 * - Error handling
 * - Response formatting
 * - Logging
 */
export function createApiHandler<T = unknown>(
  handler: (context: ApiContext & { body?: unknown }) => Promise<T>,
  options: BaseHandlerOptions = {}
): (req: NextRequest) => Promise<NextResponse<unknown>> {
  return async (req: NextRequest): Promise<NextResponse<unknown>> => {
    const startTime = Date.now()
    const method = req.method
    const path = req.nextUrl.pathname

    try {
      logInfo(`API ${method} ${path}`, { method, path })

      // Authentication
      let user: ApiContext['user'] | null = null
      if (options.requireAuth === undefined || options.requireAuth === true) {
        try {
          user = await authenticateRequest(req)
          
          // Authorization
          if (options.requireRoles && user) {
            if (!options.requireRoles.includes(user.role)) {
              return NextResponse.json(
                errorResponse('Forbidden: Insufficient permissions', 'FORBIDDEN'),
                { status: HTTP_STATUS.FORBIDDEN }
              )
            }
          }
        } catch (authError) {
          if (options.requireAuth === undefined || options.requireAuth === true) {
            return NextResponse.json(
              errorResponse('Unauthorized', 'UNAUTHORIZED'),
              { status: HTTP_STATUS.UNAUTHORIZED }
            )
          }
        }
      }

      // Parse request body
      let body: unknown = null
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          body = await req.json()
          
          // Validate required fields
          if (options.validateBody && options.requiredFields) {
            const missingFields = options.requiredFields.filter(
              field => !body || typeof body !== 'object' || !(field in body)
            )
            
            if (missingFields.length > 0) {
              return NextResponse.json(
                errorResponse(`Missing required fields: ${missingFields.join(', ')}`, 'VALIDATION_ERROR'),
                { status: HTTP_STATUS.BAD_REQUEST }
              )
            }
          }
        } catch (parseError) {
          return NextResponse.json(
            errorResponse('Invalid JSON in request body', 'PARSE_ERROR'),
            { status: HTTP_STATUS.BAD_REQUEST }
          )
        }
      }

      // Create context
      const context: ApiContext & { body?: unknown } = {
        user: user!,
        request: req,
        body,
      }

      // Execute handler
      const result = await handler(context)

      // Log success
      const duration = Date.now() - startTime
      logInfo(`API ${method} ${path} completed`, { duration: `${duration}ms` })

      // Return success response
      return NextResponse.json(successResponse(result)) as NextResponse<unknown>
    } catch (error: unknown) {
      const duration = Date.now() - startTime
      logError(`API ${method} ${path} failed`, error, { duration: `${duration}ms` })
      return handleApiError(error) as NextResponse<unknown>
    }
  }
}

/**
 * GET handler factory
 */
export function createGetHandler<T = unknown>(
  handler: (context: ApiContext) => Promise<T>,
  options?: Omit<BaseHandlerOptions, 'validateBody' | 'requiredFields'>
) {
  return createApiHandler(handler, { ...options, validateBody: false })
}

/**
 * POST handler factory
 */
export function createPostHandler<T = unknown>(
  handler: (context: ApiContext & { body?: unknown }) => Promise<T>,
  options?: BaseHandlerOptions
) {
  return createApiHandler(handler, { ...options, validateBody: true })
}

/**
 * PUT handler factory
 */
export function createPutHandler<T = unknown>(
  handler: (context: ApiContext & { body?: unknown }) => Promise<T>,
  options?: BaseHandlerOptions
) {
  return createApiHandler(handler, { ...options, validateBody: true })
}

/**
 * DELETE handler factory
 */
export function createDeleteHandler<T = unknown>(
  handler: (context: ApiContext) => Promise<T>,
  options?: Omit<BaseHandlerOptions, 'validateBody' | 'requiredFields'>
) {
  return createApiHandler(handler, { ...options, validateBody: false })
}

