/**
 * WhatsApp Templates Management API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getSettings } from '@/lib/config'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/templates
 * Get all WhatsApp templates
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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'admin' && userData.role !== 'reception')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('whatsapp_templates')
      .select('id, template_name, display_name, category, language_code, body_text, header_text, footer_text, button_type, button_text, button_urls, status, is_active, created_by, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    // Also fetch from Meta API if configured
    const settings = await getSettings()
    const accessToken = settings.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = settings.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

    let metaTemplates: Array<Record<string, unknown>> = []
    if (accessToken && phoneNumberId) {
      try {
        const metaResponse = await fetch(
          `https://graph.facebook.com/v20.0/${phoneNumberId}/message_templates`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (metaResponse.ok) {
          const metaData = await metaResponse.json()
          metaTemplates = metaData.data || []
        }
      } catch (metaError) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Error fetching templates from Meta', metaError, { endpoint: '/api/whatsapp/templates' })
        // Continue without Meta templates
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        local: data || [],
        meta: metaTemplates,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/templates' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/whatsapp/templates
 * Create a new WhatsApp template
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
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
      template_name,
      display_name,
      category,
      language_code,
      body_text,
      header_text,
      footer_text,
      button_type,
      button_text,
      button_urls,
    } = body

    if (!template_name || !display_name || !body_text) {
      return NextResponse.json(
        { success: false, error: 'Template name, display name, and body text are required' },
        { status: 400 }
      )
    }

    // Save to database
    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .insert({
        template_name,
        display_name,
        category: category || 'UTILITY',
        language_code: language_code || 'ar',
        body_text,
        header_text: header_text || null,
        footer_text: footer_text || null,
        button_type: button_type || null,
        button_text: button_text || [],
        button_urls: button_urls || [],
        status: 'pending',
        is_active: true,
        created_by: user.id,
      })
      .select('id, template_name, display_name, category, language_code, body_text, header_text, footer_text, button_type, button_text, button_urls, status, is_active, created_by, created_at, updated_at')
      .single()

    if (error) throw error

    // Optionally submit to Meta for approval
    // Note: Template submission to Meta requires specific format and approval process
    // This is a placeholder for future implementation

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/templates' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

