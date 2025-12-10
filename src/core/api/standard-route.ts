/**
 * Standard API Route Template
 * Use this as a template for all new API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getQueryParams, getPaginationParams, parseRequestBody } from '@/core/api/middleware'
import { successResponse, errorResponse, paginatedResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { z } from 'zod'

// ============================================================================
// Example: Standardized GET Route
// ============================================================================

/**
 * GET /api/resource
 * Retrieve resources with pagination and filtering
 */
export const GET = withAuth(async (context) => {
  const { request, user } = context
  const searchParams = getQueryParams(request)
  const { page, limit, offset } = getPaginationParams(request)

  // Get filters from query params
  const filter = searchParams.get('filter')
  const status = searchParams.get('status')

  // Build query (example with Supabase)
  // const { data, error, count } = await supabaseAdmin
  //   .from('table_name')
  //   .select('*', { count: 'exact' })
  //   .eq('status', status || 'active')
  //   .range(offset, offset + limit - 1)

  // if (error) throw error

  // Return paginated response
  return NextResponse.json(
    paginatedResponse([], page, limit, 0)
  )
})

// ============================================================================
// Example: Standardized POST Route
// ============================================================================

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

/**
 * POST /api/resource
 * Create a new resource
 */
export const POST = withAuth(
  async (context) => {
    const { request, user } = context

    // Parse and validate request body
    const body = await parseRequestBody(request)
    const validated = createSchema.parse(body)

    // Create resource
    // const { data, error } = await supabaseAdmin
    //   .from('table_name')
    //   .insert(validated)
    //   .select()
    //   .single()

    // if (error) throw error

    return NextResponse.json(
      successResponse({}),
      { status: HTTP_STATUS.CREATED }
    )
  },
  {
    requireRoles: ['admin'], // Optional: restrict to specific roles
  }
)

// ============================================================================
// Example: Standardized PUT Route
// ============================================================================

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

/**
 * PUT /api/resource/[id]
 * Update a resource
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (context) => {
    const { request, user } = context

    // Parse and validate
    const body = await parseRequestBody(request)
    const validated = updateSchema.parse(body)

    // Update resource
    // const { data, error } = await supabaseAdmin
    //   .from('table_name')
    //   .update(validated)
    //   .eq('id', params.id)
    //   .select()
    //   .single()

    // if (error) throw error

    return NextResponse.json(successResponse({}))
  })(req)
}

// ============================================================================
// Example: Standardized DELETE Route
// ============================================================================

/**
 * DELETE /api/resource/[id]
 * Delete a resource
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (context) => {
      const { user } = context

      // Delete resource
      // const { error } = await supabaseAdmin
      //   .from('table_name')
      //   .delete()
      //   .eq('id', params.id)

      // if (error) throw error

      return NextResponse.json(successResponse({ message: 'Deleted successfully' }))
    },
    {
      requireRoles: ['admin'],
    }
  )(req)
}
