import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSettings } from '@/lib/config'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const GET = withRateLimit(async function GET() {
  const envCheck = {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
  }

  let dbCheck: Record<string, unknown> = {}
  try {
     const { count, error } = await supabaseAdmin
        .from('settings')
        .select('id', { count: 'exact', head: true })
     
     dbCheck.settingsCount = count
     dbCheck.error = error ? error.message : null
  } catch (e: unknown) {
     dbCheck.exception = e instanceof Error ? e.message : String(e)
  }

  let loadedSettings: Record<string, unknown> = {}
  try {
     const settings = await getSettings()
     loadedSettings = {
        hasGemini: !!settings.GEMINI_KEY,
        geminiLength: settings.GEMINI_KEY?.length,
        geminiStart: settings.GEMINI_KEY ? settings.GEMINI_KEY.substring(0, 5) + '...' : 'N/A',
        hasOpenAI: !!settings.OPENAI_KEY
     }
  } catch (e: unknown) {
     loadedSettings.error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: envCheck,
    db: dbCheck,
    config: loadedSettings
  })
}, 'api')
