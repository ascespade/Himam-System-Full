/**
 * AI Prompts Management API
 * Centralized AI prompt templates management
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/system/ai-prompts
 * Get all AI prompt templates
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
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('ai_prompt_templates')
      .select('*')
      .order('category', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching AI prompts:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/system/ai-prompts
 * Create or update AI prompt template (admin only)
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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      category,
      system_prompt,
      language,
      dialect,
      variables,
      is_active,
    } = body

    if (!name || !category || !system_prompt) {
      return NextResponse.json(
        { success: false, error: 'Name, category, and system_prompt are required' },
        { status: 400 }
      )
    }

    // Get current version if exists
    const { data: existing } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('version')
      .eq('name', name)
      .single()

    const newVersion = existing ? existing.version + 1 : 1

    const { data, error } = await supabaseAdmin
      .from('ai_prompt_templates')
      .upsert({
        name,
        category,
        system_prompt,
        language: language || 'ar',
        dialect: dialect || 'jeddah',
        variables: variables || {},
        is_active: is_active !== undefined ? is_active : true,
        version: newVersion,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'name',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating/updating AI prompt:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

