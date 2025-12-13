import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/system/config
 * Get system configurations
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
    const category = searchParams.get('category')
    const key = searchParams.get('key')

    let query = supabaseAdmin
      .from('system_configurations')
      .select('*')

    if (category) {
      query = query.eq('category', category)
    }

    if (key) {
      query = query.eq('key', key)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform to key-value format
    const config: Record<string, any> = {}
    data?.forEach((item: any) => {
      if (!config[item.category]) {
        config[item.category] = {}
      }
      config[item.category][item.key] = {
        value: item.value,
        description: item.description,
        is_editable: item.is_editable
      }
    })

    return NextResponse.json({
      success: true,
      data: key && category ? config[category]?.[key]?.value : config
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/system/config' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/system/config
 * Update system configuration (admin only)
 */
export async function PUT(req: NextRequest) {
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

    // Verify admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { category, key, value, description } = body

    if (!category || !key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Category, key, and value are required' },
        { status: 400 }
      )
    }

    // Check if editable
    const { data: existing } = await supabaseAdmin
      .from('system_configurations')
      .select('is_editable, description')
      .eq('category', category)
      .eq('key', key)
      .single()

    if (existing && !existing.is_editable) {
      return NextResponse.json(
        { success: false, error: 'This configuration is not editable' },
        { status: 403 }
      )
    }

    // Upsert configuration
    const { data, error } = await supabaseAdmin
      .from('system_configurations')
      .upsert({
        category,
        key,
        value,
        description: description || (existing as any)?.description || null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'category,key'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'تم تحديث الإعدادات بنجاح'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/system/config' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

