import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

export const PUT = withRateLimit(async function PUT(req: NextRequest) {
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
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select('id, user_id, patient_id, type, title, message, entity_type, entity_id, is_read, read_at, created_at, updated_at')

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data: { count: data?.length || 0 } 
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الإشعارات'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error marking all notifications as read', error, { endpoint: '/api/notifications/mark-all-read' })
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}, 'api')

