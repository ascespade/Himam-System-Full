import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * PUT /api/reception/queue/[id]
 * Update queue item status
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { status, notes } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Set timestamps based on status
    if (status === 'in_progress' && !body.called_at) {
      updateData.called_at = new Date().toISOString()
    }
    if (status === 'completed' && !body.seen_at) {
      updateData.seen_at = new Date().toISOString()
      updateData.completed_at = new Date().toISOString()
    }
    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabaseAdmin
      .from('reception_queue')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error updating queue:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reception/queue/[id]
 * Remove from queue
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('reception_queue')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Removed from queue'
    })
  } catch (error: any) {
    console.error('Error deleting queue item:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

