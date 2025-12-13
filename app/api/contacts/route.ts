/**
 * Contacts API Route
 * Unified contacts view: patients, doctors, staff
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/contacts
 * Get all contacts from unified view
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify admin or reception
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'reception'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const contactType = searchParams.get('type') // 'patient', 'doctor', 'staff', etc.
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('contacts_view')
      .select('id, name, phone, email, contact_type, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (contactType) {
      query = query.eq('contact_type', contactType)
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب جهات الاتصال'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching contacts', error, { endpoint: '/api/contacts' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}, 'api')
