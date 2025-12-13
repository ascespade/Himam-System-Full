/**
 * Patient Monitoring System
 * Automated monitoring of patients using AI (Cron job)
 */

import { supabaseAdmin } from '@/lib/supabase'
import { patientRepository } from '@/infrastructure/supabase/repositories'

export interface PatientMonitoringResult {
  patientId: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  alerts: string[]
  recommendations: string[]
}

/**
 * Monitor all active patients for potential issues
 */
export async function monitorAllPatients(): Promise<PatientMonitoringResult[]> {
  try {
    // Get all active patients
    const { patients } = await patientRepository.search({
      status: 'active',
      limit: 1000
    })

    const results: PatientMonitoringResult[] = []

    for (const patient of patients) {
      const monitoringResult = await monitorPatient(patient.id)
      if (monitoringResult.alerts.length > 0) {
        results.push(monitoringResult)
      }
    }

    return results
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error monitoring patients', error)
    return []
  }
}

/**
 * Monitor a single patient
 */
export async function monitorPatient(patientId: string): Promise<PatientMonitoringResult> {
  const alerts: string[] = []
  const recommendations: string[] = []
  let riskLevel: PatientMonitoringResult['riskLevel'] = 'low'

  try {
    const patient = await patientRepository.findById(patientId)
    if (!patient) {
      return {
        patientId,
        riskLevel: 'low',
        alerts: [],
        recommendations: []
      }
    }

    // Check for missing critical information
    if (!patient.date_of_birth) {
      alerts.push('تاريخ الميلاد مفقود')
      riskLevel = 'medium'
    }

    if (!patient.emergency_contact_name || !patient.emergency_contact_phone) {
      alerts.push('معلومات الاتصال في حالات الطوارئ مفقودة')
      riskLevel = 'medium'
    }

    // Check for allergies without documentation
    if (patient.allergies && patient.allergies.length > 0 && !patient.notes) {
      alerts.push('يوجد حساسيات مسجلة ولكن بدون توثيق كامل')
      recommendations.push('يرجى توثيق الحساسيات بشكل كامل في ملاحظات المريض')
    }

    // Check for chronic diseases
    if (patient.chronic_diseases && patient.chronic_diseases.length > 0) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel
      recommendations.push('مريض يعاني من أمراض مزمنة - يحتاج متابعة دورية')
    }

    // Check last visit date
    const { data: lastVisit } = await supabaseAdmin
      .from('patient_visits')
      .select('visit_date')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
      .limit(1)
      .single()

    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit.visit_date)
      const daysSinceLastVisit = Math.floor(
        (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastVisit > 90) {
        alerts.push(`آخر زيارة كانت منذ ${daysSinceLastVisit} يوم`)
        riskLevel = 'medium'
        recommendations.push('يرجى التواصل مع المريض لمتابعة حالته')
      }
    }

    // Check for critical cases
    const { data: criticalCases } = await supabaseAdmin
      .from('critical_cases')
      .select('id, severity, status')
      .eq('patient_id', patientId)
      .eq('status', 'open')

    if (criticalCases && criticalCases.length > 0) {
      const hasCritical = criticalCases.some(c => c.severity === 'critical')
      if (hasCritical) {
        alerts.push('يوجد حالات حرجة مفتوحة لهذا المريض')
        riskLevel = 'critical'
      } else {
        alerts.push('يوجد حالات تحتاج متابعة')
        riskLevel = riskLevel === 'low' ? 'high' : riskLevel
      }
    }

    return {
      patientId,
      riskLevel,
      alerts,
      recommendations
    }
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError(`Error monitoring patient ${patientId}`, error, { patientId })
    return {
      patientId,
      riskLevel: 'low',
      alerts: [],
      recommendations: []
    }
  }
}

/**
 * Create critical case if monitoring detects high risk
 */
export async function createCriticalCaseIfNeeded(
  patientId: string,
  monitoringResult: PatientMonitoringResult
): Promise<void> {
  if (monitoringResult.riskLevel === 'critical' || monitoringResult.riskLevel === 'high') {
    try {
      await supabaseAdmin
        .from('critical_cases')
        .insert({
          patient_id: patientId,
          case_type: 'risk_detection',
          severity: monitoringResult.riskLevel === 'critical' ? 'critical' : 'high',
          description: `تم اكتشاف مخاطر من خلال المراقبة التلقائية:\n${monitoringResult.alerts.join('\n')}`,
          detected_by: 'ai',
          status: 'open'
        })
    } catch (error) {
      console.error('Error creating critical case:', error)
    }
  }
}
