import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/lab-results/[id]
 * Update lab result status
 */
export async function PUT(
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

    const body = await req.json()
    const { status, results, interpretation, is_abnormal } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (results) updateData.results = results
    if (interpretation) updateData.interpretation = interpretation
    if (is_abnormal !== undefined) updateData.is_abnormal = is_abnormal

    if (status === 'completed') {
      updateData.performed_date = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('lab_results')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        patients (
          id,
          name
        )
      `)
      .single()

    if (error) throw error

    // Create notification when lab result is completed
    if (status === 'completed' && data) {
      try {
        const { createNotification, createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
        
        const template = NotificationTemplates.labResultReady(
          data.patients?.name || 'مريض',
          data.test_name
        )

        // Notify admin
        await createNotificationForRole('admin', {
          ...template,
          entityType: 'lab_result',
          entityId: data.id
        })

        // Notify doctor who ordered the test
        if (data.ordered_by) {
          await createNotification({
            userId: data.ordered_by,
            ...template,
            entityType: 'lab_result',
            entityId: data.id
          })
        }
      } catch (e: unknown) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Failed to create lab result notification', e, { labResultId: data.id })
      }
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث نتيجة المختبر'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error updating lab result', error, { endpoint: '/api/lab-results/[id]', labResultId: params.id })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

