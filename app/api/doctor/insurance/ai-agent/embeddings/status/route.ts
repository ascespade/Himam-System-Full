/**
 * GET /api/doctor/insurance/ai-agent/embeddings/status
 * Get status of vector embeddings system
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = req.cookies
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
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if vector extension is enabled
    let vectorEnabled = false
    let totalEmbeddings = 0
    let claimEmbeddings = 0
    let patternEmbeddings = 0

    try {
      // Try to query vector embeddings table
      const { count: claimCount } = await supabaseAdmin
        .from('insurance_claim_embeddings')
        .select('*', { count: 'exact', head: true })

      const { count: patternCount } = await supabaseAdmin
        .from('insurance_pattern_embeddings')
        .select('*', { count: 'exact', head: true })

      vectorEnabled = true
      claimEmbeddings = claimCount || 0
      patternEmbeddings = patternCount || 0
      totalEmbeddings = claimEmbeddings + patternEmbeddings
    } catch (e: any) {
      // Table doesn't exist or pgvector not enabled
      if (e.code === '42P01' || e.message?.includes('does not exist')) {
        vectorEnabled = false
      } else {
        console.warn('Error checking vector status:', e)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: vectorEnabled,
        total_embeddings: totalEmbeddings,
        claim_embeddings: claimEmbeddings,
        pattern_embeddings: patternEmbeddings,
        status: vectorEnabled ? 'active' : 'needs_setup'
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/insurance/ai-agent/embeddings/status' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

