/**
 * PUT/DELETE /api/reception/queue/[id]
 * Update or delete queue item
 */

import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export const dynamic = 'force-dynamic'

async function verifyAuth(req: NextRequest) {
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

  if (!userData || !['reception', 'admin'].includes(userData.role)) {
    return { error: 'Forbidden', status: HTTP_STATUS.FORBIDDEN }
  }

  return { user }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req)
    if ('error' in auth) {
      return NextResponse.json(
        errorResponse(auth.error),
        { status: auth.status }
      )
    }

    const body = await req.json()
    const { status, priority, notes } = body

    const updates: any = {}
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (notes !== undefined) updates.notes = notes

    // Update timestamps based on status
    if (status === 'in_progress') {
      updates.called_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.seen_at = new Date().toISOString()
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('reception_queue')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(successResponse(data))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req)
    if ('error' in auth) {
      return NextResponse.json(
        errorResponse(auth.error),
        { status: auth.status }
      )
    }

    const { error } = await supabaseAdmin
      .from('reception_queue')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json(successResponse(null, 'تم حذف العنصر من الطابور'))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
