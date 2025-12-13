/**
 * Client-side Supabase helper
 * Creates Supabase client only when environment variables are available
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/**
 * Get or create Supabase client for client-side use
 * Returns null if environment variables are not configured
 */
export function getSupabaseClient(): SupabaseClient | null {
  // Only create client on client side
  if (typeof window === 'undefined') {
    return null
  }

  // Return cached client if exists
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Dynamic import to avoid circular dependency
    import('@/shared/utils/logger').then(({ logWarn }) => {
      logWarn('Supabase environment variables are not configured')
    }).catch(() => {
      // Logger not available, ignore
    })
    return null
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'himam-supabase-auth-token'
      }
    })
    return supabaseClient
  } catch (error) {
    // Dynamic import to avoid circular dependency
    import('@/shared/utils/logger').then(({ logError }) => {
      logError('Failed to create Supabase client', error)
    }).catch(() => {
      // Logger not available, ignore
    })
    return null
  }
}

