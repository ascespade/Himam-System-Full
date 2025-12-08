/**
 * WhatsApp Messages API
 * Get messages with filtering and pagination
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/messages
 * Get WhatsApp messages with filtering
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

    // Only admin and reception can view messages
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'admin' && userData.role !== 'reception')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    const conversationId = searchParams.get('conversation_id')
    const status = searchParams.get('status')
    const direction = searchParams.get('direction')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('whatsapp_messages')
      .select(`
        *,
        patients (id, name, phone),
        whatsapp_conversations (id, phone_number, status)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (phone) {
      query = query.or(`from_phone.eq.${phone},to_phone.eq.${phone}`)
    }

    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (direction) {
      query = query.eq('direction', direction)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    })
  } catch (error: any) {
    console.error('Error fetching WhatsApp messages:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

