/**
 * PUT/DELETE /api/admin/workflows/[id]
 * Update or delete workflow
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
      category,
      trigger_type,
      trigger_config,
      steps,
      ai_model,
      is_active,
      priority,
      version
    } = body

    const updates: any = {}
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (category) updates.category = category
    if (trigger_type) updates.trigger_type = trigger_type
    if (trigger_config) updates.trigger_config = trigger_config
    if (steps) updates.steps = steps
    if (ai_model) updates.ai_model = ai_model
    if (is_active !== undefined) updates.is_active = is_active
    if (priority !== undefined) updates.priority = priority
    if (version !== undefined) updates.version = version
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('workflows')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(successResponse(data, 'تم تحديث التدفق بنجاح'))
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
      .from('workflows')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json(successResponse(null, 'تم حذف التدفق بنجاح'))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
