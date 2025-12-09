import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase environment variables are not configured. Some features may not work.')
  }
}

// Main Supabase client with Realtime enabled
// Always create a client, even if keys are missing (will fail gracefully at runtime)
// Use singleton pattern to prevent multiple instances
let supabaseInstance: SupabaseClient | null = null

export const supabase: SupabaseClient = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        },
        auth: {
          persistSession: typeof window !== 'undefined',
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
  }
  return supabaseInstance
})()

// Admin client with service role key (server-side only, bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

