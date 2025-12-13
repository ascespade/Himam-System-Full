import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getQueryParams, getPaginationParams, parseRequestBody } from '@/core/api/middleware'
import { successResponse, paginatedResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { supabaseAdmin } from '@/lib/supabase'
import { createUserSchema } from '@/core/validations/schemas'
import { userService } from '@/core/services'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users
 * Get all users with optional filtering
 */
export const GET = withAuth(async (context) => {
  const { request } = context
  const searchParams = getQueryParams(request)
  const { page, limit, offset } = getPaginationParams(request)

  const role = searchParams.get('role')
  const search = searchParams.get('search')

  // Select specific columns for better performance
  let query = supabaseAdmin
    .from('users')
    .select('id, email, name, phone, role, created_at, updated_at', { count: 'exact' })

  // Filter by role
  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  // Search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Pagination
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return NextResponse.json(
    paginatedResponse(data || [], page, limit, count || 0)
  )
}, {
  requireRoles: ['admin'], // Only admins can list all users
})

/**
 * POST /api/users
 * Create a new user
 * Creates both auth user and public.users record
 */
export const POST = withAuth(async (context) => {
  const { request } = context

  // Parse and validate request body
  const body = await parseRequestBody(request)
  const validated = createUserSchema.parse(body)

  // Use service layer for business logic
  const user = await userService.createUser(validated)

  return NextResponse.json(
    successResponse(user),
    { status: HTTP_STATUS.CREATED }
  )
}, {
  requireRoles: ['admin'], // Only admins can create users
})

