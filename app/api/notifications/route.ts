import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب الإشعارات'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching notifications', error, { endpoint: '/api/notifications', userId: user.id })
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Internal use mostly, but can be used to trigger notifications
    const body = await req.json()
    const { user_id, patient_id, type, title, message, entity_type, entity_id } = body

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        patient_id,
        type,
        title,
        message,
        entity_type,
        entity_id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب الإشعارات'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching notifications', error, { endpoint: '/api/notifications', userId: user.id })
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
