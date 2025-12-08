import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/system/health
 * Get system health status for all components
 */
export async function GET(req: NextRequest) {
  try {
    // Check database
    const dbHealth = await checkDatabaseHealth()
    
    // Check API
    const apiHealth = await checkAPIHealth()
    
    // Check WhatsApp (if configured)
    const whatsappHealth = await checkWhatsAppHealth()
    
    // Check AI service
    const aiHealth = await checkAIHealth()

    const healthData = [
      dbHealth,
      apiHealth,
      whatsappHealth,
      aiHealth
    ].filter(Boolean)

    // Update system_health table
    for (const health of healthData) {
      await supabaseAdmin
        .from('system_health')
        .upsert({
          component: health.component,
          status: health.status,
          metrics: health.metrics,
          last_check_at: new Date().toISOString()
        }, {
          onConflict: 'component'
        })
    }

    return NextResponse.json({
      success: true,
      data: healthData
    })
  } catch (error: any) {
    console.error('Error checking system health:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

async function checkDatabaseHealth(): Promise<any> {
  try {
    const start = Date.now()
    const { error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - start

    return {
      component: 'database',
      status: error ? 'down' : responseTime > 1000 ? 'degraded' : 'healthy',
      metrics: {
        response_time_ms: responseTime,
        error: error?.message || null
      },
      last_check_at: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      component: 'database',
      status: 'down',
      metrics: { error: error.message },
      last_check_at: new Date().toISOString()
    }
  }
}

async function checkAPIHealth(): Promise<any> {
  return {
    component: 'api',
    status: 'healthy',
    metrics: {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    },
    last_check_at: new Date().toISOString()
  }
}

async function checkWhatsAppHealth(): Promise<any> {
  const whatsappEnabled = !!process.env.WHATSAPP_API_KEY
  return {
    component: 'whatsapp',
    status: whatsappEnabled ? 'healthy' : 'degraded',
    metrics: {
      enabled: whatsappEnabled
    },
    last_check_at: new Date().toISOString()
  }
}

async function checkAIHealth(): Promise<any> {
  const openaiKey = !!process.env.OPENAI_API_KEY
  const anthropicKey = !!process.env.ANTHROPIC_API_KEY
  const hasAI = openaiKey || anthropicKey

  return {
    component: 'ai',
    status: hasAI ? 'healthy' : 'degraded',
    metrics: {
      openai_configured: openaiKey,
      anthropic_configured: anthropicKey
    },
    last_check_at: new Date().toISOString()
  }
}

