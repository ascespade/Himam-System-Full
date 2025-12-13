/**
 * WhatsApp Conversation Details API
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/conversations/[id]
 * Get conversation details with messages
 */
export const GET = withRateLimit(async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const conversationId = params.id

    // Get conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select(`
        id, phone_number, patient_id, status, last_message_at, unread_count, assigned_to, tags, notes, created_at, updated_at,
        patients (id, name, phone),
        users:assigned_to (id, name, role)
      `)
      .eq('id', conversationId)
      .single()

    if (convError) throw convError

    // Get messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('id, message_id, from_phone, to_phone, message_type, content, status, direction, session_id, conversation_id, patient_id, created_at, updated_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    // Mark conversation as read
    await supabaseAdmin
      .from('whatsapp_conversations')
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages: messages || [],
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/conversations/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * PUT /api/whatsapp/conversations/[id]
 * Update conversation
 */
export const PUT = withRateLimit(async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const conversationId = params.id
    const body = await req.json()
    const { status, assigned_to, tags, notes, unread_count } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) updateData.status = status
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to
    if (tags !== undefined) updateData.tags = tags
    if (notes !== undefined) updateData.notes = notes
    if (unread_count !== undefined) updateData.unread_count = unread_count

    const { data, error } = await supabaseAdmin
      .from('whatsapp_conversations')
      .update(updateData)
      .eq('id', conversationId)
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
    logError('Error', error, { endpoint: '/api/whatsapp/conversations/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

