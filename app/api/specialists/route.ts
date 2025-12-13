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
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabaseAdmin
      .from('specialists')
      .select('id, name, specialty, nationality, email, phone, created_at, updated_at')
      .order('name')
      .limit(limit)

    if (search) {
      query = query.or(`name.ilike.%${search}%,specialty.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: specialists, error } = await query

    if (error) throw error

    return NextResponse.json(successResponse(specialists || []))
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

