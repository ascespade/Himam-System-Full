/**
 * Universal Flows API Route
 * Works for ANY module/scenario in the project
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { HTTP_STATUS } from '@/shared/constants'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/flows
 * Get all flows (filtered by module if provided)
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const { searchParams } = new URL(req.url)
    const flowModule = searchParams.get('module')
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')
    const tag = searchParams.get('tag')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('flows')
      .select('id, name, description, module, category, trigger_type, trigger_config, nodes, edges, execution_mode, retry_config, timeout_seconds, ai_enabled, ai_model, ai_prompt, ai_context, is_active, priority, tags, metadata, created_by, created_at, updated_at', { count: 'exact' })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (flowModule) {
      query = query.eq('module', flowModule)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data, error, count } = await query

    if (error) throw error

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/flows' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}, 'api')

/**
 * POST /api/flows
 * Create new flow
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const body = await req.json()
    const {
      name,
      description,
      module: flowModule,
      category,
      trigger_type,
      trigger_config,
      nodes,
      edges,
      execution_mode,
      retry_config,
      timeout_seconds,
      ai_enabled,
      ai_model,
      ai_prompt,
      ai_context,
      is_active,
      priority,
      tags,
      metadata,
    } = body

    // Validation
    if (!name || !flowModule || !trigger_type) {
      return NextResponse.json(
        { success: false, error: 'Name, module, and trigger_type are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one node is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('flows')
      .insert({
        name,
        description: description || null,
        module: flowModule,
        category: category || 'automation',
        trigger_type,
        trigger_config: trigger_config || {},
        nodes: nodes || [],
        edges: edges || [],
        execution_mode: execution_mode || 'async',
        retry_config: retry_config || { enabled: false, max_retries: 3, backoff: 'exponential' },
        timeout_seconds: timeout_seconds || 300,
        ai_enabled: ai_enabled || false,
        ai_model: ai_model || 'gemini-2.0-flash',
        ai_prompt: ai_prompt || null,
        ai_context: ai_context || {},
        is_active: is_active !== undefined ? is_active : true,
        priority: priority || 0,
        tags: tags || [],
        metadata: metadata || {},
        created_by: user.id,
      })
      .select('id, name, description, module, category, trigger_type, trigger_config, nodes, edges, execution_mode, retry_config, timeout_seconds, ai_enabled, ai_model, ai_prompt, ai_context, is_active, priority, tags, metadata, created_by, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/flows' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}, 'api')
