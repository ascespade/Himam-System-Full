import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

/**
 * GET /api/cms/[id]
 * Get a single content item by ID
 */
export const GET = withRateLimit(async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  try {
    const { data, error } = await supabaseAdmin
      .from('content_items')
      .select('id, type, title_ar, description_ar, is_active, order_index, created_at, updated_at')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Content item not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}, 'api')

/**
 * PUT /api/cms/[id]
 * Update a content item
 */
export const PUT = withRateLimit(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  try {
    const body = await request.json()
    const { title, description, type, category, status, author } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type) updateData.type = type
    if (category !== undefined) updateData.category = category
    if (status) updateData.status = status
    if (author !== undefined) updateData.author = author

    const { data, error } = await supabaseAdmin
      .from('content_items')
      .update(updateData)
      .eq('id', params.id)
      .select('id, type, title_ar, description_ar, is_active, order_index, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}, 'api')

/**
 * DELETE /api/cms/[id]
 * Delete a content item
 */
export const DELETE = withRateLimit(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  try {
    const { error } = await supabaseAdmin
      .from('content_items')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}, 'api')
