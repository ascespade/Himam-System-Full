import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

// Get all content
export const GET = withRateLimit(async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('content_items')
      .select('id, type, title_ar, description_ar, is_active, order_index, created_at, updated_at', { count: 'exact' })
      .order('order_index', { ascending: true })
      .range(offset, offset + limit - 1)

    // If table doesn't exist, return empty or mock for now to prevent crash
    if (error && error.code === '42P01') {
       return NextResponse.json({
         success: true,
         data: [],
         pagination: {
           page: 1,
           limit,
           total: 0,
           totalPages: 0,
           hasNext: false,
           hasPrev: false,
         },
       })
    }
    
    if (error) throw error

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}, 'api')

// Create/Update content
export const POST = withRateLimit(async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, type, title_ar, description_ar, is_active } = body // Simplified for MVP

    // Upsert
    const { data, error } = await supabaseAdmin
      .from('content_items')
      .upsert({ 
         id: id || undefined,
         type, 
         title_ar, 
         description_ar, 
         is_active,
         updated_at: new Date().toISOString()
      })
      .select('id, type, title_ar, description_ar, is_active, order_index, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}, 'api')
