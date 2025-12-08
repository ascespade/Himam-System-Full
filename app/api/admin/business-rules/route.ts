/**
 * Business Rules Management API
 * إدارة القواعد التجارية من Admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/business-rules
 * Get all business rules
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
          remove(name: string, options: CookieOptions) {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify user is admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const { data: rules, error } = await supabaseAdmin
      .from('business_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(successResponse(rules || []))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/business-rules
 * Create new business rule
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
          remove(name: string, options: CookieOptions) {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify user is admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const body = await req.json()
    const {
      name,
      description,
      type,
      condition,
      action,
      priority,
      is_active,
      applies_to,
      error_message
    } = body

    // Validate
    if (!name || !type || !condition || !action) {
      return NextResponse.json(
        errorResponse('Name, type, condition, and action are required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate condition is valid JSON
    try {
      JSON.parse(typeof condition === 'string' ? condition : JSON.stringify(condition))
    } catch (e) {
      return NextResponse.json(
        errorResponse('Invalid condition format'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data: rule, error } = await supabaseAdmin
      .from('business_rules')
      .insert({
        name,
        description: description || null,
        type,
        condition: typeof condition === 'string' ? condition : JSON.stringify(condition),
        action,
        priority: priority || 0,
        is_active: is_active !== undefined ? is_active : true,
        applies_to: applies_to || ['all'],
        error_message: error_message || null,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    // Clear cache in business rules engine
    try {
      const { businessRulesEngine } = await import('@/core/business-rules/engine')
      await businessRulesEngine.loadRules()
    } catch (e) {
      console.error('Failed to reload rules cache:', e)
    }

    return NextResponse.json(
      successResponse(rule, 'تم إنشاء القاعدة بنجاح'),
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
