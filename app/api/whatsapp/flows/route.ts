/**
 * WhatsApp Flows API Route
 * Manage flows for WhatsApp AI Agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/flows
 * Get all WhatsApp flows
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
        { success: false, error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify admin
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
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('whatsapp_flows')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/flows' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * POST /api/whatsapp/flows
 * Create new WhatsApp flow
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
        { success: false, error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify admin
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
      category,
      trigger_type,
      trigger_config,
      steps,
      appointment_actions,
      ai_model,
      system_prompt,
      response_template,
      is_active,
      priority,
    } = body

    // Validation
    if (!name || !category || !trigger_type) {
      return NextResponse.json(
        { success: false, error: 'Name, category, and trigger_type are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_flows')
      .insert({
        name,
        description: description || null,
        category,
        trigger_type,
        trigger_config: trigger_config || {},
        steps: steps || [],
        appointment_actions: appointment_actions || [],
        ai_model: ai_model || 'gemini-2.0-flash',
        system_prompt: system_prompt || null,
        response_template: response_template || null,
        is_active: is_active !== undefined ? is_active : true,
        priority: priority || 0,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/flows' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
