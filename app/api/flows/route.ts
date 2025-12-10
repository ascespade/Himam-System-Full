/**
 * Universal Flows API Route
 * Works for ANY module/scenario in the project
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { HTTP_STATUS } from '@/shared/constants'

export const dynamic = 'force-dynamic'

/**
 * GET /api/flows
 * Get all flows (filtered by module if provided)
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, value: string, options: CookieOptions) {},
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
    const module = searchParams.get('module')
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')
    const tag = searchParams.get('tag')

    let query = supabaseAdmin
      .from('flows')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (module) {
      query = query.eq('module', module)
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

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error: any) {
    console.error('Error fetching flows:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * POST /api/flows
 * Create new flow
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, value: string, options: CookieOptions) {},
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
      module,
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
    if (!name || !module || !trigger_type) {
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
        module,
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
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating flow:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
