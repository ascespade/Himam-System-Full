/**
 * Error Pattern Learning System
 * Tracks and learns from errors to prevent future issues
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface ErrorPattern {
  errorType: string
  errorMessage: string
  context: Record<string, unknown>
  rejectionReason?: string
}

/**
 * Record an error pattern
 */
export async function recordErrorPattern(error: ErrorPattern): Promise<void> {
  try {
    // Create hash of the error pattern
    const patternHash = await createPatternHash(error)

    // Check if pattern already exists
    const { data: existing } = await supabaseAdmin
      .from('error_pattern_learning')
      .select('id, occurrence_count')
      .eq('pattern_hash', patternHash)
      .single()

    if (existing) {
      // Update occurrence count
      await supabaseAdmin
        .from('error_pattern_learning')
        .update({
          occurrence_count: (existing.occurrence_count || 1) + 1,
          last_occurred_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Create new pattern
      await supabaseAdmin
        .from('error_pattern_learning')
        .insert({
          error_type: error.errorType,
          error_message: error.errorMessage,
          context: error.context,
          rejection_reason: error.rejectionReason || null,
          pattern_hash: patternHash,
          occurrence_count: 1,
          is_resolved: false
        })
    }
  } catch (err) {
    console.error('Error recording error pattern:', err)
  }
}

/**
 * Check if error pattern should trigger warning
 */
export async function checkErrorPattern(
  errorType: string,
  context: Record<string, unknown>
): Promise<{
  shouldWarn: boolean
  warningMessage?: string
  similarPatterns?: unknown[]
}> {
  try {
    // Get similar error patterns
    const { data: patterns } = await supabaseAdmin
      .from('error_pattern_learning')
      .select('*')
      .eq('error_type', errorType)
      .eq('is_resolved', false)
      .order('occurrence_count', { ascending: false })
      .limit(5)

    if (!patterns || patterns.length === 0) {
      return { shouldWarn: false }
    }

    // Check if context matches any pattern
    const matchingPattern = patterns.find(p => {
      const patternContext = p.context as Record<string, unknown>
      return Object.keys(context).some(key => patternContext[key] === context[key])
    })

    if (matchingPattern && matchingPattern.occurrence_count >= 3) {
      return {
        shouldWarn: true,
        warningMessage: `تحذير: هذا النوع من الأخطاء حدث ${matchingPattern.occurrence_count} مرات من قبل. ${matchingPattern.rejection_reason || ''}`,
        similarPatterns: patterns
      }
    }

    return { shouldWarn: false, similarPatterns: patterns }
  } catch (error) {
    console.error('Error checking error pattern:', error)
    return { shouldWarn: false }
  }
}

/**
 * Mark error pattern as resolved
 */
export async function resolveErrorPattern(patternId: string, resolutionNotes: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('error_pattern_learning')
      .update({
        is_resolved: true,
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', patternId)
  } catch (error) {
    console.error('Error resolving error pattern:', error)
  }
}

/**
 * Create hash of error pattern
 */
async function createPatternHash(error: ErrorPattern): Promise<string> {
  const crypto = await import('crypto')
  const hashInput = `${error.errorType}:${error.errorMessage}:${JSON.stringify(error.context)}`
  return crypto.createHash('sha256').update(hashInput).digest('hex')
}
