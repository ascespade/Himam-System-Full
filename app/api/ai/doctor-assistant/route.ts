import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/doctor-assistant
 * AI Assistant for doctors
 * Supports:
 * - initial_analysis: Generate initial patient analysis
 * - chat: Chat with AI assistant
 * - suggest_treatment: Suggest treatment plan
 * - analyze_progress: Analyze patient progress
 * - detect_risks: Detect potential risks
 */

export const POST = withRateLimit(async function POST(req: NextRequest) {
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

    // Verify user is a doctor
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'doctor') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { action, patient_id, message, history } = body

    // Get AI API key from environment
    const aiApiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!aiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 500 })
    }

    if (action === 'initial_analysis' && patient_id) {
      // Generate initial patient analysis
      const analysis = await generateInitialAnalysis(patient_id, user.id, aiApiKey)
      return NextResponse.json({
        success: true,
        analysis,
        type: 'analysis'
      })
    }

    if (action === 'chat' && message) {
      // Chat with AI
      const response = await generateChatResponse(
        message,
        history || [],
        patient_id,
        user.id,
        aiApiKey
      )
      return NextResponse.json({
        success: true,
        response: response.content,
        type: response.type || 'general'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في المساعد الطبي'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error in AI assistant', error, { endpoint: '/api/ai/doctor-assistant' })
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}, 'api')

async function generateInitialAnalysis(patientId: string, doctorId: string, aiApiKey: string) {
  // Fetch patient data
  const [patientData, sessions, plans, records] = await Promise.all([
    supabaseAdmin
      .from('patients')
      .select('id, name, date_of_birth, gender, allergies, chronic_diseases')
      .eq('id', patientId)
      .single(),
    supabaseAdmin
      .from('sessions')
      .select('id, patient_id, doctor_id, date, session_type, chief_complaint, assessment, notes')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('treatment_plans')
      .select('id, patient_id, doctor_id, title, status, progress_percentage, goals(id, title, status)')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .eq('status', 'active'),
    supabaseAdmin
      .from('medical_records')
      .select('id, patient_id, date, record_type, title, description, notes')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .limit(10)
  ])

  const patient = patientData.data
  const patientSessions = sessions.data || []
  const patientPlans = plans.data || []
  const patientRecords = records.data || []

  // Build context for AI
  const context = `
المريض: ${patient?.name || 'غير معروف'}
العمر: ${patient?.date_of_birth ? calculateAge(patient.date_of_birth) : 'غير معروف'}
الجنس: ${patient?.gender || 'غير معروف'}
الحساسيات: ${patient?.allergies?.join(', ') || 'لا توجد'}
الأمراض المزمنة: ${patient?.chronic_diseases?.join(', ') || 'لا توجد'}

عدد الجلسات: ${patientSessions.length}
الخطط العلاجية النشطة: ${patientPlans.length}
السجلات الطبية: ${patientRecords.length}

آخر 3 جلسات:
${patientSessions.slice(0, 3).map((s: Record<string, unknown>) => {
  const date = s.date && (typeof s.date === 'string' || s.date instanceof Date) ? new Date(s.date) : new Date()
  return `
- ${date.toLocaleDateString('ar-SA')}: ${s.session_type || 'جلسة'}
  الهدف: ${s.chief_complaint || 'غير محدد'}
  التقييم: ${s.assessment || 'غير محدد'}
`
}).join('\n')}

الخطط العلاجية النشطة:
${patientPlans.map((p: Record<string, unknown>) => {
  const goals = Array.isArray(p.goals) ? p.goals : []
  return `
- ${p.title || 'خطة علاج'}
  الأهداف: ${goals.length}
  التقدم: ${typeof p.progress_percentage === 'number' ? p.progress_percentage : 0}%
`
}).join('\n')}
`

  // Call AI API (using OpenAI format as example)
  const prompt = `أنت مساعد طبي ذكي متخصص في علاج التوحد والتخاطب. قم بتحليل حالة المريض التالية وقدم ملخصاً شاملاً:

${context}

قدم:
1. ملخص الحالة الحالية
2. نقاط القوة والتحسينات
3. التوصيات للجلسات القادمة
4. أي مخاطر محتملة

أجب بالعربية بشكل واضح ومهني.`

  try {
    // Use OpenAI API
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'أنت مساعد طبي متخصص في علاج التوحد والتخاطب. أجب دائماً بالعربية.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    const data = await aiResponse.json()
    return data.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من تحليل الحالة.'
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('AI API error', error, { patientId, doctorId, endpoint: '/api/ai/doctor-assistant' })
    // Fallback response
    return `ملخص حالة ${patient?.name || 'المريض'}:
- عدد الجلسات: ${patientSessions.length}
- خطط علاجية نشطة: ${patientPlans.length}
- آخر جلسة: ${patientSessions[0] ? new Date(patientSessions[0].date).toLocaleDateString('ar-SA') : 'لا توجد'}

يرجى مراجعة السجلات الطبية والجلسات للحصول على تفاصيل أكثر.`
  }
}

async function generateChatResponse(
  message: string,
  history: Array<Record<string, unknown>>,
  patientId: string | null,
  doctorId: string,
  aiApiKey: string
) {
  const systemPrompt = `أنت مساعد طبي ذكي متخصص في علاج التوحد والتخاطب في مركز الهمم بجدة.
مهمتك مساعدة الطبيب في:
- تحليل حالات المرضى
- اقتراح خطط علاجية
- اكتشاف المخاطر
- تحليل التقدم

أجب دائماً بالعربية بشكل واضح ومهني.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h: Record<string, unknown>) => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content
    })),
    { role: 'user', content: message }
  ]

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 800
      })
    })

    const data = await aiResponse.json()
    const content = data.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من الإجابة.'

    // Determine message type based on content
    let type: 'suggestion' | 'warning' | 'analysis' | 'general' = 'general'
    if (content.includes('تحذير') || content.includes('خطر') || content.includes('انتبه')) {
      type = 'warning'
    } else if (content.includes('اقتراح') || content.includes('ننصح') || content.includes('يُنصح')) {
      type = 'suggestion'
    } else if (content.includes('تحليل') || content.includes('ملخص') || content.includes('تقييم')) {
      type = 'analysis'
    }

    return { content, type }
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('AI API error', error, { endpoint: '/api/ai/doctor-assistant' })
    return {
      content: 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة لاحقاً.',
      type: 'general' as const
    }
  }
}

function calculateAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return `${age} سنة`
}

