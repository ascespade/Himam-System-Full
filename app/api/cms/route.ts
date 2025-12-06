import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Get all content
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_items')
      .select('*')
      .order('order_index', { ascending: true })

    // If table doesn't exist, return empty or mock for now to prevent crash
    if (error && error.code === '42P01') {
       return NextResponse.json({ success: true, data: [] })
    }
    
    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Create/Update content
export async function POST(req: Request) {
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
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
