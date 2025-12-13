import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/knowledge/[id]
 * Get a single knowledge item by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Knowledge item not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Increment views
    await supabaseAdmin
      .from('knowledge_base')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', params.id)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/knowledge/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/knowledge/[id]
 * Update a knowledge item
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { title, content, category, tags } = body

    // Check if item exists
    const { data: existingItem } = await supabaseAdmin
      .from('knowledge_base')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Knowledge item not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (title) updateData.title = title
    if (content) updateData.content = content
    if (category) updateData.category = category
    if (tags) updateData.tags = tags

    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/knowledge/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/knowledge/[id]
 * Delete a knowledge item
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('knowledge_base')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Knowledge item deleted successfully'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/knowledge/[id]' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

