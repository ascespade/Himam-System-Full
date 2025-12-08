/**
 * Auto-Documentation System API
 * AI-powered automatic documentation generation
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { askAI } from '@/lib/ai'
import { getAIPromptTemplate } from '@/lib/ai-prompts'

export const dynamic = 'force-dynamic'

/**
 * POST /api/doctor/auto-documentation
 * Generate automatic documentation for a session, treatment plan, or assessment
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
    const { entity_type, entity_id, documentation_type, context } = body

    if (!entity_type || !entity_id || !documentation_type) {
      return NextResponse.json(
        { success: false, error: 'Entity type, entity ID, and documentation type are required' },
        { status: 400 }
      )
    }

    // Fetch entity data based on type
    let entityData: any = null
    let patientData: any = null

    if (entity_type === 'session') {
      const { data: session } = await supabaseAdmin
        .from('sessions')
        .select(`
          *,
          patients (*),
          doctors:doctor_id (*),
          medical_records (*)
        `)
        .eq('id', entity_id)
        .eq('doctor_id', user.id)
        .single()

      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
      }

      entityData = session
      patientData = session.patients
    } else if (entity_type === 'treatment_plan') {
      const { data: plan } = await supabaseAdmin
        .from('treatment_plans')
        .select(`
          *,
          patients (*),
          sessions (*),
          medical_records (*)
        `)
        .eq('id', entity_id)
        .eq('doctor_id', user.id)
        .single()

      if (!plan) {
        return NextResponse.json({ success: false, error: 'Treatment plan not found' }, { status: 404 })
      }

      entityData = plan
      patientData = plan.patients
    } else if (entity_type === 'assessment') {
      // Fetch assessment data
      const { data: assessment } = await supabaseAdmin
        .from('medical_records')
        .select(`
          *,
          patients (*)
        `)
        .eq('id', entity_id)
        .eq('record_type', 'assessment')
        .eq('doctor_id', user.id)
        .single()

      if (!assessment) {
        return NextResponse.json({ success: false, error: 'Assessment not found' }, { status: 404 })
      }

      entityData = assessment
      patientData = assessment.patients
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid entity type' },
        { status: 400 }
      )
    }

    // Get prompt template from database
    const promptTemplate = await getAIPromptTemplate('auto_documentation', {
      patient_name: patientData?.name || 'المريض',
      session_type: entityData.session_type || 'غير محدد',
      date: new Date(entityData.date).toLocaleDateString('ar-SA'),
      duration: String(entityData.duration || 'غير محدد'),
    })

    // Build AI prompt based on documentation type
    let prompt = ''
    const patientName = patientData?.name || 'المريض'

    if (documentation_type === 'session_summary') {
      prompt = `${promptTemplate}

المريض: ${patientName}
نوع الجلسة: ${entityData.session_type || 'غير محدد'}
التاريخ: ${new Date(entityData.date).toLocaleDateString('ar-SA')}
المدة: ${entityData.duration || 'غير محدد'} دقيقة

السياق الإضافي:
${context || 'لا يوجد سياق إضافي'}

السجلات الطبية المرتبطة:
${entityData.medical_records?.map((r: any) => `- ${r.notes || r.description}`).join('\n') || 'لا توجد سجلات'}

قم بإنشاء ملخص احترافي يتضمن:
1. ملخص الجلسة
2. الأهداف المحققة
3. التقدم الملاحظ
4. التوصيات
5. الخطوات التالية

استخدم لهجة جدة الخفيفة والاحترافية.
      `
    } else if (documentation_type === 'progress_report') {
      prompt = `${promptTemplate}

المريض: ${patientName}
خطة العلاج: ${entityData.title || 'غير محدد'}
الحالة: ${entityData.status || 'غير محدد'}

الجلسات المكتملة:
${entityData.sessions?.map((s: any) => `- ${new Date(s.date).toLocaleDateString('ar-SA')}: ${s.session_type}`).join('\n') || 'لا توجد جلسات'}

السياق الإضافي:
${context || 'لا يوجد سياق إضافي'}

قم بإنشاء تقرير تقدم يتضمن:
1. نظرة عامة على التقدم
2. الإنجازات الرئيسية
3. التحديات
4. التوصيات
5. الخطوات القادمة

استخدم لهجة جدة الخفيفة والاحترافية.
      `
    } else if (documentation_type === 'treatment_plan_update') {
      prompt = `${promptTemplate}

المريض: ${patientName}
الخطة الحالية: ${entityData.title || 'غير محدد'}
الحالة: ${entityData.status || 'غير محدد'}

السياق الإضافي:
${context || 'لا يوجد سياق إضافي'}

قم بإنشاء تحديث يتضمن:
1. التقدم المحرز
2. التعديلات المطلوبة
3. التوصيات الجديدة
4. الجدول الزمني المحدث

استخدم لهجة جدة الخفيفة والاحترافية.
      `
    } else if (documentation_type === 'assessment_summary') {
      prompt = `${promptTemplate}

المريض: ${patientName}
نوع التقييم: ${entityData.record_type || 'غير محدد'}
التاريخ: ${new Date(entityData.created_at).toLocaleDateString('ar-SA')}

الملاحظات:
${entityData.notes || entityData.description || 'لا توجد ملاحظات'}

السياق الإضافي:
${context || 'لا يوجد سياق إضافي'}

قم بإنشاء ملخص يتضمن:
1. النتائج الرئيسية
2. الملاحظات المهمة
3. التوصيات
4. الخطوات التالية

استخدم لهجة جدة الخفيفة والاحترافية.
      `
    }

    // Generate documentation using AI
    const aiResponse = await askAI(prompt, JSON.stringify({ entity_type, entity_id, patientData }))

    if (aiResponse.error) {
      throw new Error(`AI generation failed: ${aiResponse.error}`)
    }

    // Save to auto_documentation_logs
    const { data: docLog, error: logError } = await supabaseAdmin
      .from('auto_documentation_logs')
      .insert({
        entity_type,
        entity_id,
        doctor_id: user.id,
        documentation_type,
        generated_content: aiResponse.text,
        ai_model: aiResponse.model,
        prompt_used: prompt,
        metadata: { context, patientData: { name: patientName } },
      })
      .select()
      .single()

    if (logError) throw logError

    return NextResponse.json({
      success: true,
      data: {
        documentation: aiResponse.text,
        log_id: docLog.id,
        model: aiResponse.model,
      },
    })
  } catch (error: any) {
    console.error('Error generating auto-documentation:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/doctor/auto-documentation
 * Get auto-documentation logs for a doctor
 */
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

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entity_type')
    const entityId = searchParams.get('entity_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabaseAdmin
      .from('auto_documentation_logs')
      .select('*')
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    if (entityId) {
      query = query.eq('entity_id', entityId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching auto-documentation logs:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

