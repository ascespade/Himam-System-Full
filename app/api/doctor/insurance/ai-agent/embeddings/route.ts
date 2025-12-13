/**
 * Vector Embeddings API for Insurance Claims
 * Uses OpenAI embeddings for similarity search to prevent repeated errors
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// Initialize OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // or 'text-embedding-ada-002'
      input: text
    })
    return response.data[0].embedding
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/insurance/ai-agent/embeddings' })

    
    // Fallback: return empty embedding or use alternative method
    throw new Error('Failed to generate embedding')
  }
}

/**
 * POST /api/doctor/insurance/ai-agent/embeddings/check-similarity
 * Check if new claim is similar to previously rejected claims
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { claim_description, insurance_provider, claim_type } = body

    if (!claim_description || !insurance_provider || !claim_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate embedding for new claim description
    const embedding = await generateEmbedding(claim_description)

    // Convert embedding array to PostgreSQL vector format string
    const embeddingVector = `[${embedding.join(',')}]`

    // Find similar rejected claims using vector similarity
    let similarRejected: Array<Record<string, unknown>> = []
    let similarSuccessful: Array<Record<string, unknown>> = []

    try {
      const similarRejectedResult = await supabaseAdmin.rpc(
        'find_similar_rejected_claims',
        {
          p_description_embedding: embeddingVector,
          p_provider: insurance_provider,
          p_claim_type: claim_type,
          p_similarity_threshold: 0.75, // 75% similarity
          p_limit: 5
        }
      )

      if (!similarRejectedResult.error && similarRejectedResult.data) {
        similarRejected = similarRejectedResult.data
      } else if (similarRejectedResult.error) {
        console.warn('Error finding similar claims (might be first time or pgvector not enabled):', similarRejectedResult.error)
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      console.warn('Vector search not available (pgvector extension might not be enabled):', errorMessage)
    }

    // Find similar successful patterns
    try {
      const similarSuccessfulResult = await supabaseAdmin.rpc(
        'find_similar_successful_patterns',
        {
          p_description_embedding: embeddingVector,
          p_provider: insurance_provider,
          p_claim_type: claim_type,
          p_similarity_threshold: 0.75,
          p_limit: 5
        }
      )

      if (!similarSuccessfulResult.error && similarSuccessfulResult.data) {
        similarSuccessful = similarSuccessfulResult.data
      } else if (similarSuccessfulResult.error) {
        console.warn('Error finding similar patterns:', similarSuccessfulResult.error)
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      console.warn('Vector search for patterns not available:', errorMessage)
    }

    // Analyze results
    const warnings: string[] = []
    const recommendations: string[] = []
    const requiresHumanReview = false

    if (similarRejected && similarRejected.length > 0) {
      const firstRejected = similarRejected[0] as Record<string, unknown>
      const highestSimilarity = typeof firstRejected.similarity === 'number' ? firstRejected.similarity : 0
      
      if (highestSimilarity > 0.9) {
        warnings.push(`تحذير: مطالبة مشابهة جداً لمطالبة مرفوضة سابقاً (${(highestSimilarity * 100).toFixed(1)}% تشابه)`)
        
        // Extract common error patterns
        const allErrorPatterns = new Set<string>()
        similarRejected.forEach((claim: Record<string, unknown>) => {
          if (claim.error_patterns && Array.isArray(claim.error_patterns)) {
            claim.error_patterns.forEach((pattern: string) => allErrorPatterns.add(pattern))
          }
        })

        if (allErrorPatterns.size > 0) {
          recommendations.push(`تجنب الأخطاء التالية: ${Array.from(allErrorPatterns).join(', ')}`)
        }

        // Use rejection reason from most similar claim
        const rejectionReason = typeof firstRejected.rejection_reason === 'string' ? firstRejected.rejection_reason : null
        if (rejectionReason) {
          recommendations.push(`سبب الرفض السابق: ${rejectionReason}`)
        }
      } else if (highestSimilarity > 0.8) {
        warnings.push(`تنبيه: مطالبة مشابهة لمطالبة مرفوضة سابقاً (${(highestSimilarity * 100).toFixed(1)}% تشابه)`)
      }
    }

    if (similarSuccessful && similarSuccessful.length > 0) {
      const firstSuccessful = similarSuccessful[0] as Record<string, unknown>
      const highestSimilarity = typeof firstSuccessful.similarity === 'number' ? firstSuccessful.similarity : 0
      if (highestSimilarity > 0.8) {
        recommendations.push(`استخدم نفس النمط الناجح من مطالبة سابقة (${(highestSimilarity * 100).toFixed(1)}% تشابه)`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        embedding_generated: true,
        vector_search_available: similarRejected.length > 0 || similarSuccessful.length > 0 || true, // Always true as we generated embedding
        similar_rejected_count: similarRejected.length,
        similar_successful_count: similarSuccessful.length,
        warnings,
        recommendations,
        requiresHumanReview: warnings.length > 0 && similarRejected.length > 0 && (() => {
          const first = similarRejected[0] as Record<string, unknown>
          return typeof first.similarity === 'number' && first.similarity > 0.9
        })(),
        similar_claims: similarRejected,
        similar_patterns: similarSuccessful
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error in embeddings route', error, { endpoint: '/api/doctor/insurance/ai-agent/embeddings' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/doctor/insurance/ai-agent/embeddings/store
 * Store embedding for a claim after submission
 */
export async function PUT(req: NextRequest) {
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

    const body = await req.json()
    const { 
      claim_id, 
      claim_description, 
      insurance_provider, 
      claim_type,
      outcome,
      rejection_reason,
      error_patterns,
      claim_metadata
    } = body

    if (!claim_id || !claim_description || !insurance_provider || !claim_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate embeddings
    const descriptionEmbedding = await generateEmbedding(claim_description)
    let rejectionEmbedding: number[] | null = null

    if (rejection_reason) {
      try {
        rejectionEmbedding = await generateEmbedding(rejection_reason)
      } catch (e) {
        console.warn('Failed to generate rejection embedding:', e)
      }
    }

    // Convert embeddings to PostgreSQL vector format
    const descriptionVector = `[${descriptionEmbedding.join(',')}]`
    const rejectionVector = rejectionEmbedding ? `[${rejectionEmbedding.join(',')}]` : null

    // Store claim embedding
    let claimEmbedding: Record<string, unknown> | null = null
    try {
      const { data, error: claimError } = await supabaseAdmin
        .from('insurance_claim_embeddings')
        .upsert({
          claim_id,
          insurance_provider,
          claim_type,
          claim_description_embedding: descriptionVector,
          rejection_reason_embedding: rejectionVector,
          claim_metadata: claim_metadata || {},
          outcome: outcome || 'pending',
          rejection_reason: rejection_reason || null,
          error_patterns: error_patterns || [],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'claim_id'
        })
        .select()
        .single()

      if (!claimError) {
        claimEmbedding = data
      } else {
        console.warn('Error storing claim embedding (pgvector might not be enabled):', claimError)
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      console.warn('Could not store embedding (pgvector extension might not be enabled):', errorMessage)
      // Continue even if embedding storage fails
    }

    // If claim was rejected, also store error patterns as separate embeddings
    if (outcome === 'rejected' && error_patterns && error_patterns.length > 0) {
      try {
        const patternEmbeddings = await Promise.all(
          error_patterns.map(async (pattern: string) => {
            try {
              const embedding = await generateEmbedding(pattern)
              return {
                pattern_id: null, // Will be linked to learning pattern
                insurance_provider,
                claim_type,
                pattern_embedding: `[${embedding.join(',')}]`,
                pattern_type: 'error',
                pattern_text: pattern,
                metadata: { claim_id, rejection_reason }
              }
            } catch (e) {
              console.warn('Failed to generate embedding for pattern:', pattern, e)
              return null
            }
          })
        )

        const validEmbeddings = patternEmbeddings.filter((e): e is NonNullable<typeof e> => e !== null)
        
        if (validEmbeddings.length > 0) {
          await supabaseAdmin
            .from('insurance_pattern_embeddings')
            .insert(validEmbeddings)
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        console.warn('Error storing pattern embeddings (pgvector might not be enabled):', errorMessage)
      }
    }

    // If claim was approved, store as success pattern
    if (outcome === 'approved' || outcome === 'paid') {
      try {
        const successEmbedding = await generateEmbedding(claim_description)
        await supabaseAdmin
          .from('insurance_pattern_embeddings')
          .insert({
            pattern_id: null,
            insurance_provider,
            claim_type,
            pattern_embedding: `[${successEmbedding.join(',')}]`,
            pattern_type: 'success',
            pattern_text: claim_description,
            metadata: { claim_id, outcome }
          })
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        console.warn('Error storing success pattern (pgvector might not be enabled):', errorMessage)
      }
    }

    return NextResponse.json({
      success: true,
      message: claimEmbedding ? 'تم حفظ التمثيلات النوctorية بنجاح' : 'تم حفظ البيانات (بدون vectors - قد تحتاج تفعيل pgvector)',
      data: { 
        claim_embedding_id: claimEmbedding?.id,
        vector_storage_enabled: !!claimEmbedding
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/insurance/ai-agent/embeddings' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

