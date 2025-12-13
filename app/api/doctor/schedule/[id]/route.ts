import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/doctor/schedule/[id]
 * Update schedule
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

    // Verify ownership
    const { data: schedule } = await supabaseAdmin
      .from('doctor_schedules')
      .select('doctor_id')
      .eq('id', params.id)
      .single()

    if (!schedule || schedule.doctor_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (body.day_of_week !== undefined) updateData.day_of_week = body.day_of_week
    if (body.start_time !== undefined) updateData.start_time = body.start_time
    if (body.end_time !== undefined) updateData.end_time = body.end_time
    if (body.break_start !== undefined) updateData.break_start = body.break_start || null
    if (body.break_end !== undefined) updateData.break_end = body.break_end || null
    if (body.slot_duration !== undefined) updateData.slot_duration = body.slot_duration
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabaseAdmin
      .from('doctor_schedules')
      .update(updateData)
      .eq('id', params.id)
      // Select specific columns for better performance
      .select('id, doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_active, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/schedule/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * DELETE /api/doctor/schedule/[id]
 * Delete schedule
 */
export const DELETE = withRateLimit(async function DELETE(
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

    // Verify ownership
    const { data: schedule } = await supabaseAdmin
      .from('doctor_schedules')
      .select('doctor_id')
      .eq('id', params.id)
      .single()

    if (!schedule || schedule.doctor_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not found or unauthorized' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('doctor_schedules')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({
      success: true
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/schedule/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

