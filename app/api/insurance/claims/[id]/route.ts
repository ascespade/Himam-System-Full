import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * PUT /api/insurance/claims/[id]
 * Update insurance claim status
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { status, rejection_reason } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved' || status === 'paid') {
      updateData.processed_date = new Date().toISOString()
    }

    if (rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data, error } = await supabaseAdmin
      .from('insurance_claims')
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

    // Create Notifications for approval
    if ((status === 'approved' || status === 'paid') && data) {
      try {
        const { createNotification, createNotificationForRole, NotificationTemplates } = await import('@/lib/notifications')
        
        const template = NotificationTemplates.insuranceClaimApproved(
          data.patients?.name || 'مريض',
          Number(data.total_amount) || 0
        )

        // Notify admin
        await createNotificationForRole('admin', {
          ...template,
          entityType: 'insurance_claim',
          entityId: data.id
        })
      } catch (e) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Failed to create claim approval notifications', e, { claimId: params.id, endpoint: '/api/insurance/claims/[id]' })
      }
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/insurance/claims/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

