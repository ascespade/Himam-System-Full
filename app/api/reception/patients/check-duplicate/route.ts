/**
 * POST /api/reception/patients/check-duplicate
 * Check if patient already exists (by phone or name)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { successResponse, errorResponse, handleApiError } from '@/shared/utils/api'

export const dynamic = 'force-dynamic'

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
        errorResponse('Unauthorized'),
        { status: 401 }
      )
    }

    const body = await req.json()
    const { phone, name } = body

    if (!phone && !name) {
      return NextResponse.json(
        errorResponse('Phone or name is required'),
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('patients')
      .select('id, name, phone, created_at')

    if (phone) {
      query = query.eq('phone', phone)
    } else if (name) {
      query = query.ilike('name', `%${name}%`)
    }

    const { data: existing, error } = await query.limit(5)

    if (error) throw error

    return NextResponse.json(successResponse({
      isDuplicate: (existing && existing.length > 0),
      matches: existing || []
    }))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
