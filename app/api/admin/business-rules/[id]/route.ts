/**
 * PUT/DELETE /api/admin/business-rules/[id]
 * Update or delete business rule
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      type,
      condition,
      action,
      priority,
      is_active,
      applies_to,
      error_message
    } = body

    const updates: any = {}
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (type) updates.type = type
    if (condition) {
      // Validate condition
      try {
        JSON.parse(typeof condition === 'string' ? condition : JSON.stringify(condition))
        updates.condition = typeof condition === 'string' ? condition : JSON.stringify(condition)
      } catch (e) {
        return NextResponse.json(
          errorResponse('Invalid condition format'),
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
    }
    if (action) updates.action = action
    if (priority !== undefined) updates.priority = priority
    if (is_active !== undefined) updates.is_active = is_active
    if (applies_to) updates.applies_to = applies_to
    if (error_message !== undefined) updates.error_message = error_message

    const { data: rule, error } = await supabaseAdmin
      .from('business_rules')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // Clear cache
    try {
      const { businessRulesEngine } = await import('@/core/business-rules/engine')
      await businessRulesEngine.loadRules()
    } catch (e) {
      console.error('Failed to reload rules cache:', e)
    }

    return NextResponse.json(successResponse(rule, 'تم تحديث القاعدة بنجاح'))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin(req)
    if ('error' in auth) {
      return NextResponse.json(
        errorResponse(auth.error),
        { status: auth.status }
      )
    }

    const { error } = await supabaseAdmin
      .from('business_rules')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    // Clear cache
    try {
      const { businessRulesEngine } = await import('@/core/business-rules/engine')
      await businessRulesEngine.loadRules()
    } catch (e) {
      console.error('Failed to reload rules cache:', e)
    }

    return NextResponse.json(successResponse(null, 'تم حذف القاعدة بنجاح'))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
