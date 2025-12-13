import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/doctor/risk-detection
 * Detect potential risks for patients
 * Analyzes:
 * - Missed appointments
 * - Lack of progress
 * - Medication/session compliance
 * - Warning signs in records
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
    const patientId = searchParams.get('patient_id')

    const risks: any[] = []

    if (patientId) {
      // Patient-specific risk detection
      const patientRisks = await detectPatientRisks(patientId, user.id)
      risks.push(...patientRisks)
    } else {
      // All patients risk detection
      const allRisks = await detectAllPatientsRisks(user.id)
      risks.push(...allRisks)
    }

    // Sort by severity
    risks.sort((a, b) => {
      const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 }
      return (severityOrder[a.severity as keyof typeof severityOrder] || 99) -
             (severityOrder[b.severity as keyof typeof severityOrder] || 99)
    })

    return NextResponse.json({
      success: true,
      data: risks,
      count: risks.length
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/doctor/risk-detection' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

async function detectPatientRisks(patientId: string, doctorId: string) {
  const risks: any[] = []
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // 1. Check for missed appointments
  const { data: missedAppointments } = await supabaseAdmin
    .from('appointments')
    .select('id, date, status, patients(name)')
    .eq('patient_id', patientId)
    .eq('doctor_id', doctorId)
    .eq('status', 'no_show')
    .gte('date', thirtyDaysAgo.toISOString())

  if (missedAppointments && missedAppointments.length >= 2) {
    const patientName = (missedAppointments[0] as any)?.patients?.name || 'المريض'
    risks.push({
      type: 'missed_appointments',
      severity: 'high',
      title: 'تغيب متكرر عن المواعيد',
      description: `المريض تغيب عن ${missedAppointments.length} مواعيد في آخر 30 يوم`,
      patient_id: patientId,
      patient_name: patientName,
      action_required: true,
      suggested_action: 'التواصل مع المريض/الوالدين لتحديد سبب التغيب'
    })
  }

  // 2. Check for lack of progress
  const { data: recentSessions } = await supabaseAdmin
    .from('sessions')
    .select('date, assessment, plan')
    .eq('patient_id', patientId)
    .eq('doctor_id', doctorId)
    .gte('date', thirtyDaysAgo.toISOString())
    .order('date', { ascending: false })
    .limit(5)

  if (recentSessions && recentSessions.length >= 3) {
    const hasProgress = recentSessions.some(s => 
      s.assessment?.toLowerCase().includes('تحسن') ||
      s.assessment?.toLowerCase().includes('تقدم') ||
      s.plan?.toLowerCase().includes('تحسن')
    )

    if (!hasProgress) {
      risks.push({
        type: 'lack_of_progress',
        severity: 'medium',
        title: 'عدم ملاحظة تقدم واضح',
        description: 'آخر 3 جلسات لا تظهر تحسناً ملحوظاً',
        patient_id: patientId,
        action_required: true,
        suggested_action: 'مراجعة الخطة العلاجية وتعديلها إذا لزم الأمر'
      })
    }
  }

  // 3. Check for long gap between sessions
  if (recentSessions && recentSessions.length > 0) {
    const lastSessionDate = new Date(recentSessions[0].date)
    const daysSinceLastSession = Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastSession > 30) {
      risks.push({
        type: 'long_gap',
        severity: 'medium',
        title: 'فجوة طويلة بين الجلسات',
        description: `آخر جلسة كانت منذ ${daysSinceLastSession} يوم`,
        patient_id: patientId,
        action_required: true,
        suggested_action: 'جدولة موعد جديد في أقرب وقت'
      })
    }
  }

  // 4. Check treatment plan progress
  const { data: activePlans } = await supabaseAdmin
    .from('treatment_plans')
    .select('id, title, start_date, progress_percentage, goals(*)')
    .eq('patient_id', patientId)
    .eq('doctor_id', doctorId)
    .eq('status', 'active')

  if (activePlans && activePlans.length > 0) {
    for (const plan of activePlans) {
      const planStartDate = new Date(plan.start_date)
      const daysSinceStart = Math.floor((now.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceStart > 60 && plan.progress_percentage < 20) {
        risks.push({
          type: 'low_plan_progress',
          severity: 'medium',
          title: 'تقدم بطيء في الخطة العلاجية',
          description: `الخطة "${plan.title}" بدأت منذ ${daysSinceStart} يوم والتقدم ${plan.progress_percentage}% فقط`,
          patient_id: patientId,
          plan_id: plan.id,
          action_required: true,
          suggested_action: 'مراجعة الأهداف وتعديلها إذا لزم الأمر'
        })
      }

      // Check for overdue goals
      const overdueGoals = plan.goals?.filter((g: Record<string, unknown>) => {
        if (!g.target_date || g.status === 'completed') return false
        return new Date(g.target_date) < now
      })

      if (overdueGoals && overdueGoals.length > 0) {
        risks.push({
          type: 'overdue_goals',
          severity: 'low',
          title: 'أهداف متأخرة',
          description: `${overdueGoals.length} هدف في الخطة "${plan.title}" تجاوز تاريخه المستهدف`,
          patient_id: patientId,
          plan_id: plan.id,
          action_required: false,
          suggested_action: 'تحديث تواريخ الأهداف أو إعادة تقييمها'
        })
      }
    }
  }

  // 5. Check for critical notes in medical records
  const { data: criticalRecords } = await supabaseAdmin
    .from('medical_records')
    .select('id, title, description, date')
    .eq('patient_id', patientId)
    .gte('date', thirtyDaysAgo.toISOString())
    .or('description.ilike.%خطر%,description.ilike.%تحذير%,description.ilike.%انتبه%,title.ilike.%خطر%,title.ilike.%تحذير%')

  if (criticalRecords && criticalRecords.length > 0) {
    risks.push({
      type: 'critical_notes',
      severity: 'high',
      title: 'ملاحظات مهمة في السجلات الطبية',
      description: `تم العثور على ${criticalRecords.length} سجل يحتوي على كلمات تحذيرية`,
      patient_id: patientId,
      action_required: true,
      suggested_action: 'مراجعة السجلات الطبية فوراً'
    })
  }

  return risks
}

async function detectAllPatientsRisks(doctorId: string) {
  // Get all active patients
  const { data: relationships } = await supabaseAdmin
    .from('doctor_patient_relationships')
    .select('patient_id, patients(name)')
    .eq('doctor_id', doctorId)
    .is('end_date', null)

  if (!relationships) return []

  const allRisks: any[] = []

  // Check risks for each patient (limit to avoid timeout)
  for (const rel of relationships.slice(0, 50)) {
    const patientRisks = await detectPatientRisks(rel.patient_id, doctorId)
    allRisks.push(...patientRisks)
  }

  return allRisks
}

