/**
 * Guardian Notifications API
 * Get notifications for the authenticated guardian
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { supabaseAdmin } from '@/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/guardian/notifications
 * Get notifications for guardian
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

    // Verify user is guardian
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'guardian') {
      return NextResponse.json(
        errorResponse('Forbidden - Guardian access only'),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    // Get notifications for guardian
    // Note: Adjust based on your notifications table structure
    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error, count } = await query

    if (error) throw error

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')

    // Filter by type if provided (e.g., 'approval')
    let filteredNotifications = notifications || []
    if (type === 'approval') {
      // Filter for approval-related notifications
      filteredNotifications = filteredNotifications.filter((n: any) => 
        n.type === 'approval_request' || 
        n.type === 'procedure_approval' ||
        n.title?.includes('موافقة') ||
        n.message?.includes('موافقة')
      )
    }

    return NextResponse.json(successResponse(filteredNotifications))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
