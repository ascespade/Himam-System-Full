/**
 * WhatsApp Conversations API
 * Manage WhatsApp conversations
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/conversations
 * Get all conversations with filters
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
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assigned_to')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('whatsapp_conversations')
      .select(`
        id, phone_number, patient_id, status, last_message_at, unread_count, assigned_to, tags, notes, created_at, updated_at,
        patients (id, name, phone),
        users:assigned_to (id, name, role)
      `, { count: 'exact' })
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/conversations' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/whatsapp/conversations
 * Create or update conversation
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

    const body = await req.json()
    const { phone_number, patient_id, assigned_to, status, tags, notes } = body

    if (!phone_number) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_conversations')
      .upsert({
        phone_number,
        patient_id: patient_id || null,
        assigned_to: assigned_to || null,
        status: status || 'active',
        tags: tags || [],
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'phone_number',
      })
      .select('id, phone_number, patient_id, status, last_message_at, unread_count, assigned_to, tags, notes, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/conversations' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

