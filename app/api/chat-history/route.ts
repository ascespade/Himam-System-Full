import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Phone number required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('conversation_history')
      .select('*')
      .eq('user_phone', phone)
      .order('created_at', { ascending: true }) // Chronological order

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
