/**
 * POST /api/doctor/clinic/open
 * Open clinic (set is_open = true)
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if clinic_settings exists, create if not
    const { data: existing } = await supabaseAdmin
      .from('clinic_settings')
      .select('id')
      .eq('doctor_id', user.id)
      .maybeSingle()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('clinic_settings')
        .update({
          is_open: true,
          updated_at: new Date().toISOString(),
        })
        .eq('doctor_id', user.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('clinic_settings')
        .insert({
          doctor_id: user.id,
          is_open: true,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'تم فتح العيادة بنجاح'
    })
  } catch (error: any) {
    console.error('Error opening clinic:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

