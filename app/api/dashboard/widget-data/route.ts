import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/widget-data
 * Get data for a specific widget
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const widgetId = searchParams.get('widget_id')

    if (!widgetId) {
      return NextResponse.json(
        { success: false, error: 'Widget ID is required' },
        { status: 400 }
      )
    }

    // Get widget configuration
    const { data: widget, error: widgetError } = await supabaseAdmin
      .from('dashboard_configurations')
      .select('id, user_role, widget_type, widget_title, widget_config, position, is_visible, created_at, updated_at')
      .eq('id', widgetId)
      .single()

    if (widgetError || !widget) {
      return NextResponse.json(
        { success: false, error: 'Widget not found' },
        { status: 404 }
      )
    }

    // Generate data based on widget type
    let data: Record<string, unknown> | null = null

    if (widget.widget_type === 'chart') {
      data = await generateChartData(widget.widget_config, user.id)
    } else if (widget.widget_type === 'table') {
      data = await generateTableData(widget.widget_config, user.id)
    } else if (widget.widget_type === 'list') {
      data = await generateListData(widget.widget_config, user.id)
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/dashboard/widget-data' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

async function generateChartData(config: any, userId: string): Promise<Record<string, unknown>> {
  // This would generate chart data based on config
  // For now, return sample data
  return {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [{
      label: config.metric || 'البيانات',
      data: [12, 19, 15, 25, 22, 30]
    }]
  }
}

async function generateTableData(config: any, userId: string): Promise<Record<string, unknown>> {
  const entity = config.entity || 'appointments'
  const limit = config.limit || 10

  // Get user role to filter data
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  // Note: Dynamic entity queries need explicit columns, but we don't know the schema
  // For now, we'll use a limited select - in production, this should be validated per entity
  let query = supabaseAdmin.from(entity).select('id, created_at, updated_at').limit(limit)

  // Filter by user role
  if (userData?.role === 'doctor') {
    query = query.eq('doctor_id', userId)
  }

  const { data, error } = await query

  if (error) throw error

  return { data: data || [] }
}

async function generateListData(config: any, userId: string): Promise<Record<string, unknown>> {
  // Similar to table data
  return generateTableData(config, userId)
}

