import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { applyRateLimitCheck, addRateLimitHeadersToResponse } from '@/core/api/middleware/applyRateLimit'

/**
 * GET /api/knowledge/[id]
 * Get a single knowledge item by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, title, content, category, tags, views, created_at, updated_at')
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

    const response = NextResponse.json({
      success: true,
      data
    })
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
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
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

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
      .select('id, title, content, category, tags, views, created_at, updated_at')
      .single()

    if (error) throw error

    const response = NextResponse.json({
      success: true,
      data
    })
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
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
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimitCheck(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { error } = await supabaseAdmin
      .from('knowledge_base')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    const response = NextResponse.json({
      success: true,
      message: 'Knowledge item deleted successfully'
    })
    addRateLimitHeadersToResponse(response, req, 'api')
    return response
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

