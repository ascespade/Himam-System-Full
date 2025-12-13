/**
 * Test AI Endpoint
 * Test if AI is working correctly
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { generateWhatsAppResponse } from '@/lib/ai'
import { getSettings } from '@/lib/config'

export const dynamic = 'force-dynamic'

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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { message, phone } = body

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check settings
    const settings = await getSettings()
    const hasGeminiKey = !!settings.GEMINI_KEY && settings.GEMINI_KEY.length > 0
    const hasOpenAIKey = !!settings.OPENAI_KEY && settings.OPENAI_KEY.length > 0

    if (!hasGeminiKey && !hasOpenAIKey) {
      return NextResponse.json({
        success: false,
        error: 'No AI keys configured. Please configure GEMINI_KEY or OPENAI_KEY in settings.',
        details: {
          hasGeminiKey,
          hasOpenAIKey,
          geminiKeyLength: settings.GEMINI_KEY?.length || 0,
          openaiKeyLength: settings.OPENAI_KEY?.length || 0,
        },
      }, { status: 400 })
    }

    // Test AI
    const testPhone = phone || '966581421483'
    const startTime = Date.now()

    try {
      const aiResponse = await generateWhatsAppResponse(
        testPhone,
        message,
        undefined,
        undefined
      )

      const duration = Date.now() - startTime

      return NextResponse.json({
        success: true,
        data: {
          response: aiResponse.text,
          model: aiResponse.model,
          error: aiResponse.error,
          duration: `${duration}ms`,
          settings: {
            hasGeminiKey,
            hasOpenAIKey,
            geminiKeyLength: settings.GEMINI_KEY?.length || 0,
            openaiKeyLength: settings.OPENAI_KEY?.length || 0,
          },
        },
      })
    } catch (aiError: any) {
      const duration = Date.now() - startTime
      return NextResponse.json({
        success: false,
        error: 'AI generation failed',
        details: {
          message: aiError.message,
          stack: aiError.stack,
          duration: `${duration}ms`,
          settings: {
            hasGeminiKey,
            hasOpenAIKey,
            geminiKeyLength: settings.GEMINI_KEY?.length || 0,
            openaiKeyLength: settings.OPENAI_KEY?.length || 0,
          },
        },
      }, { status: 500 })
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/test-ai' })

    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}

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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Check settings status
    const settings = await getSettings()
    const hasGeminiKey = !!settings.GEMINI_KEY && settings.GEMINI_KEY.length > 0
    const hasOpenAIKey = !!settings.OPENAI_KEY && settings.OPENAI_KEY.length > 0

    return NextResponse.json({
      success: true,
      data: {
        hasGeminiKey,
        hasOpenAIKey,
        geminiKeyLength: settings.GEMINI_KEY?.length || 0,
        openaiKeyLength: settings.OPENAI_KEY?.length || 0,
        geminiKeyPreview: settings.GEMINI_KEY ? `${settings.GEMINI_KEY.substring(0, 10)}...` : 'Not set',
        openaiKeyPreview: settings.OPENAI_KEY ? `${settings.OPENAI_KEY.substring(0, 10)}...` : 'Not set',
        status: hasGeminiKey || hasOpenAIKey ? 'configured' : 'not_configured',
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/whatsapp/test-ai' })

    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}




