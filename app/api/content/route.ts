// app/api/content/route.ts
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  // Fetch all active content items (you can filter by type if needed)
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title_ar, title_en, description_ar, description_en, type, is_active')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching content items:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to a generic shape expected by the UI
  const items = (data || []).map((item: any) => ({
    id: item.id,
    title: item.title_ar ?? item.title_en ?? 'بدون عنوان',
    category: item.type ?? 'غير مصنف',
    // For demo purposes we use a placeholder view count; you can replace with a real metric later
    views: Math.floor(Math.random() * 200),
    status: item.is_active ? 'Published' : 'Draft',
  }));

  return NextResponse.json({ items });
}
