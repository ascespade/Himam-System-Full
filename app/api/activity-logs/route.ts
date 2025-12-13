import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/activity-logs
 * Get activity logs with filtering
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const role = searchParams.get('role')
    const entityType = searchParams.get('entity_type')
    const actionType = searchParams.get('action_type')

    // Get user role
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by user role (non-admins can only see their own logs)
    if (userData?.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    if (role) {
      query = query.eq('user_role', role)
    }

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب سجلات النشاط'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching activity logs', error, { endpoint: '/api/activity-logs' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/activity-logs
 * Create activity log (usually called by other APIs)
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      action_type,
      entity_type,
      entity_id,
      description,
      metadata
    } = body

    if (!action_type || !description) {
      return NextResponse.json(
        { success: false, error: 'Action type and description are required' },
        { status: 400 }
      )
    }

    // Get user role
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Get IP and user agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: user.id,
        user_role: userData?.role || 'unknown',
        action_type,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        description,
        metadata: metadata || null,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء سجل النشاط'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error creating activity log', error, { endpoint: '/api/activity-logs' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

