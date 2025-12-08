/**
 * Workflows Management API
 * API لإدارة التدفقات الديناميكية
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest) {
  const cookieStore = req.cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized', status: HTTP_STATUS.UNAUTHORIZED }
  }

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    return { error: 'Forbidden', status: HTTP_STATUS.FORBIDDEN }
  }

  return { user }
}

/**
 * GET /api/admin/workflows
 * Get all workflows
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ('error' in auth) {
      return NextResponse.json(
        errorResponse(auth.error),
        { status: auth.status }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('workflows')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(successResponse(data || []))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/workflows
 * Create new workflow
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ('error' in auth) {
      return NextResponse.json(
        errorResponse(auth.error),
        { status: auth.status }
      )
    }

    const body = await req.json()
    const {
      name,
      description,
      category,
      trigger_type,
      trigger_config,
      steps,
      ai_model,
      is_active,
      priority,
      version
    } = body

    if (!name || !category || !trigger_type) {
      return NextResponse.json(
        errorResponse('Name, category, and trigger_type are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('workflows')
      .insert({
        name,
        description: description || null,
        category,
        trigger_type,
        trigger_config: trigger_config || {},
        steps: steps || [],
        ai_model: ai_model || 'gpt-4',
        is_active: is_active !== undefined ? is_active : true,
        priority: priority || 0,
        version: version || 1
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      successResponse(data, 'تم إنشاء التدفق بنجاح'),
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
