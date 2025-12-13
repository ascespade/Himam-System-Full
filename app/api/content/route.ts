// app/api/content/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cookieStore = req.cookies;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  );
  // Fetch all active content items (you can filter by type if needed)
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title_ar, title_en, description_ar, description_en, type, is_active')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching content items', error, { endpoint: '/api/content' })
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to a generic shape expected by the UI
  const items = (data || []).map((item: Record<string, unknown>) => ({
    id: item.id,
    title: item.title_ar ?? item.title_en ?? 'بدون عنوان',
    category: item.type ?? 'غير مصنف',
    // For demo purposes we use a placeholder view count; you can replace with a real metric later
    views: Math.floor(Math.random() * 200),
    status: item.is_active ? 'Published' : 'Draft',
  }));

  return NextResponse.json({ items });
}
