/**
 * Specialists API Route
 * Manages specialist data
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const GET = withRateLimit(async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('specialists')
      .select('id, name, specialty, nationality, email, phone, created_at, updated_at', { count: 'exact' })
      .order('name')
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,specialty.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: specialists, error, count } = await query

    if (error) throw error

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(successResponse({
      data: specialists || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}, 'api')

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, specialty, nationality, email } = body

    if (!name || !specialty) {
      return NextResponse.json(
        errorResponse('Name and specialty are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: specialist, error } = await supabaseAdmin
      .from('specialists')
      .insert({
        name,
        specialty,
        nationality: nationality || '',
        email: email || '',
      })
      .select('id, name, specialty, nationality, email, phone, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json(successResponse(specialist), { status: HTTP_STATUS.CREATED })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}, 'api')

