import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/knowledge
 * Get all knowledge items with optional filtering
 */
export const GET = withRateLimit(async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('knowledge_base')
      .select('id, title, content, category, tags, views, created_at, updated_at', { count: 'exact' })

    // Filter by category
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    // If table doesn't exist, return empty array
    if (error && error.code === '42P01') {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب قاعدة المعرفة'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching knowledge', error, { endpoint: '/api/knowledge' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

/**
 * POST /api/knowledge
 * Create a new knowledge item
 */
export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, category, tags } = body

    // Validation
    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content, category' },
        { status: 400 }
      )
    }

    const knowledgeData = {
      title,
      content,
      category,
      tags: tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0
    }

    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .insert(knowledgeData)
      .select('id, title, content, category, tags, views, created_at, updated_at')
      .single()

    // If table doesn't exist, return error suggesting to create it
    if (error && error.code === '42P01') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Knowledge base table does not exist. Please create it first.',
          code: 'TABLE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء عنصر المعرفة'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error creating knowledge item', error, { endpoint: '/api/knowledge' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

