/**
 * API Middleware
 * Centralized middleware for authentication, authorization, and error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import type { User } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export type UserRole = 'admin' | 'doctor' | 'patient' | 'staff' | 'reception' | 'guardian' | 'supervisor'

export interface AuthenticatedUser extends User {
  role: UserRole
}

export interface ApiContext {
  user: AuthenticatedUser
  request: NextRequest
}

export type ApiHandler<T = unknown> = (
  context: ApiContext
) => Promise<NextResponse<{ success: boolean; data?: T; error?: string; code?: string }>>

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Creates a Supabase server client from request cookies
 */
export function createSupabaseClient(req: NextRequest) {
  const cookieStore = req.cookies
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Server-side: cookies are handled by Next.js
        },
        remove(name: string, options: CookieOptions) {
          // Server-side: cookies are handled by Next.js
        },
      },
    }
  )
}

/**
 * Authenticates the request and returns the user
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedUser> {
  const supabase = createSupabaseClient(req)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Fetch user role from database
  const { data: userData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleError || !userData) {
    throw new Error('Failed to fetch user role')
  }

  return {
    ...user,
    role: userData.role as UserRole,
  }
}

// ============================================================================
// Authorization Middleware
// ============================================================================

/**
 * Checks if user has required role(s)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (user: AuthenticatedUser) => {
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Forbidden: Insufficient permissions')
    }
  }
}

// ============================================================================
// API Route Wrapper
// ============================================================================

/**
 * Wraps an API handler with authentication, authorization, and error handling
 * Note: Rate limiting should be applied separately using withRateLimit
 */
export function withAuth(
  handler: ApiHandler,
  options?: {
    requireRoles?: UserRole[]
    requireAuth?: boolean
  }
) {
  return async (req: NextRequest) => {
    try {
      // Authenticate
      const user = await authenticateRequest(req)

      // Authorize
      if (options?.requireRoles) {
        requireRole(...options.requireRoles)(user)
      }

      // Create context
      const context: ApiContext = {
        user,
        request: req,
      }

      // Execute handler
      return await handler(context)
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json(
          errorResponse('Unauthorized'),
          { status: HTTP_STATUS.UNAUTHORIZED }
        )
      }
      if (error instanceof Error && error.message.includes('Forbidden')) {
        return NextResponse.json(
          errorResponse('Forbidden: Insufficient permissions'),
          { status: HTTP_STATUS.FORBIDDEN }
        )
      }
      return handleApiError(error)
    }
  }
}

/**
 * Wraps an API handler with optional authentication
 */
export function withOptionalAuth(handler: ApiHandler) {
  return async (req: NextRequest) => {
    try {
      let user: AuthenticatedUser | null = null
      
      try {
        user = await authenticateRequest(req)
      } catch {
        // Auth is optional, continue without user
      }

      const context: ApiContext = {
        user: user!,
        request: req,
      }

      return await handler(context)
    } catch (error: unknown) {
      return handleApiError(error)
    }
  }
}

// ============================================================================
// Request Parsing Helpers
// ============================================================================

/**
 * Gets query parameters from request
 */
export function getQueryParams(req: NextRequest): URLSearchParams {
  return req.nextUrl.searchParams
}

/**
 * Gets a single query parameter
 */
export function getQueryParam(req: NextRequest, key: string): string | null {
  return req.nextUrl.searchParams.get(key)
}

/**
 * Gets pagination parameters from query
 */
export function getPaginationParams(req: NextRequest) {
  const page = parseInt(getQueryParam(req, 'page') || '1')
  const limit = parseInt(getQueryParam(req, 'limit') || '50')
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Safely parses JSON request body
 */
export async function parseRequestBody<T = unknown>(req: NextRequest): Promise<T> {
  try {
    const body = await req.json()
    return body as T
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}
