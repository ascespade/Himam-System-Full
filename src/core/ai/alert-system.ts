/**
 * Alert System
 * Sends alerts based on monitoring results
 */

import { supabaseAdmin } from '@/lib/supabase'
import { createNotification, NotificationTemplates } from '@/lib/notifications'
import type { PatientMonitoringResult } from './patient-monitoring'

/**
 * Send alerts based on monitoring results
 */
export async function sendMonitoringAlerts(
  results: PatientMonitoringResult[]
): Promise<void> {
  for (const result of results) {
    if (result.alerts.length > 0) {
      await sendAlertForPatient(result)
    }
  }
}

/**
 * Send alert for a specific patient
 */
async function sendAlertForPatient(result: PatientMonitoringResult): Promise<void> {
  try {
    // Get patient details
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id, name')
      .eq('id', result.patientId)
      .single()

    if (!patient) return

    // Determine alert level
    const alertTitle = result.riskLevel === 'critical'
      ? `⚠️ حالة حرجة: ${patient.name}`
      : result.riskLevel === 'high'
      ? `🔴 تنبيه عالي: ${patient.name}`
      : `🟡 تنبيه: ${patient.name}`

    const alertMessage = `
${result.alerts.join('\n')}

${result.recommendations.length > 0 ? `\nالتوصيات:\n${result.recommendations.join('\n')}` : ''}
    `.trim()

    // Notify supervisors
    const { data: supervisors } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'supervisor')

    if (supervisors) {
      for (const supervisor of supervisors) {
        await createNotification({
          userId: supervisor.id,
          title: alertTitle,
          message: alertMessage,
          type: result.riskLevel === 'critical' ? 'critical' : 'warning',
          entityType: 'patient',
          entityId: result.patientId
        })
      }
    }

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (admins) {
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: alertTitle,
          message: alertMessage,
          type: result.riskLevel === 'critical' ? 'critical' : 'warning',
          entityType: 'patient',
          entityId: result.patientId
        })
      }
    }
  } catch (error) {
    console.error('Error sending alert:', error)
  }
}

/**
 * Send critical case alert
 */
export async function sendCriticalCaseAlert(
  caseId: string,
  patientId: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): Promise<void> {
  try {
    const { data: criticalCase } = await supabaseAdmin
      .from('critical_cases')
      .select('*, patients(name)')
      .eq('id', caseId)
      .single()

    if (!criticalCase) return

    const patientName = (criticalCase.patients as any)?.name || 'مريض'

    const alertTitle = severity === 'critical'
      ? `🚨 حالة حرجة: ${patientName}`
      : `⚠️ حالة تحتاج متابعة: ${patientName}`

    const alertMessage = `
نوع الحالة: ${criticalCase.case_type}
الخطورة: ${severity}
الوصف: ${criticalCase.description}
    `.trim()

    // Notify supervisors and admins
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .in('role', ['supervisor', 'admin'])

    if (users) {
      for (const user of users) {
        await createNotification({
          userId: user.id,
          title: alertTitle,
          message: alertMessage,
          type: severity === 'critical' ? 'critical' : 'warning',
          entityType: 'critical_case',
          entityId: caseId
        })
      }
    }
  } catch (error) {
    console.error('Error sending critical case alert:', error)
  }
}
