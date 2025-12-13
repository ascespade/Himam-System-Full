/**
 * WhatsApp Guardian Notifications
 * Send notifications to guardians via WhatsApp
 */

import { sendTextMessage } from '../whatsapp-messaging'
import { guardianRepository, patientRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '../supabase'

export interface GuardianNotificationOptions {
  patientId: string
  message: string
  notificationType: 'appointment' | 'session_complete' | 'approval_required' | 'status_update' | 'reminder'
  urgency?: 'low' | 'normal' | 'high'
}

/**
 * Send notification to all active guardians of a patient
 */
export async function notifyGuardians(options: GuardianNotificationOptions): Promise<void> {
  try {
    // Get all active guardians for the patient
    const relationships = await guardianRepository.getPatientGuardians(options.patientId)

    // Get patient details
    const patient = await patientRepository.findById(options.patientId)
    if (!patient) {
      // Patient not found (error logged via logger if needed)
      return
    }

    // Get guardian user details
    const guardianUsers = await Promise.all(
      relationships.map(async (rel) => {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, name, phone')
          .eq('id', rel.guardian_id)
          .single()

        return { user, relationship: rel }
      })
    )

    // Send notifications to each guardian
    for (const { user, relationship } of guardianUsers) {
      if (!user?.phone) continue

      // Format message with patient name
      const formattedMessage = formatGuardianMessage(options.message, patient.name, options.notificationType)

      try {
        await sendTextMessage(user.phone, formattedMessage)
        // Guardian notification sent (logged via logger if needed)
      } catch (error) {
        // Failed to send WhatsApp to guardian (error logged via logger if needed)
      }
    }
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error notifying guardians', error)
  }
}

/**
 * Format message for guardian notification
 */
function formatGuardianMessage(
  message: string,
  patientName: string,
  type: GuardianNotificationOptions['notificationType']
): string {
  const prefix = `🔔 إشعار ولي الأمر - ${patientName}\n\n`
  
  const typeEmojis: Record<string, string> = {
    appointment: '📅',
    session_complete: '✅',
    approval_required: '⚠️',
    status_update: '📊',
    reminder: '⏰'
  }

  return `${prefix}${typeEmojis[type] || '📌'} ${message}`
}

/**
 * Notify guardians about appointment
 */
export async function notifyGuardiansAboutAppointment(
  patientId: string,
  appointmentDate: string,
  appointmentTime: string,
  specialist: string
): Promise<void> {
  await notifyGuardians({
    patientId,
    message: `تم حجز موعد جديد:\nالتاريخ: ${appointmentDate}\nالوقت: ${appointmentTime}\nالأخصائي: ${specialist}`,
    notificationType: 'appointment',
    urgency: 'normal'
  })
}

/**
 * Notify guardians about session completion
 */
export async function notifyGuardiansAboutSession(
  patientId: string,
  sessionDate: string,
  notes?: string
): Promise<void> {
  await notifyGuardians({
    patientId,
    message: `تم إكمال الجلسة:\nالتاريخ: ${sessionDate}${notes ? `\nملاحظات: ${notes}` : ''}`,
    notificationType: 'session_complete',
    urgency: 'normal'
  })
}

/**
 * Notify guardians about approval required
 */
export async function notifyGuardiansAboutApproval(
  patientId: string,
  procedureName: string,
  procedureId: string
): Promise<void> {
  await notifyGuardians({
    patientId,
    message: `يتطلب موافقتك على الإجراء:\n${procedureName}\n\nيرجى الموافقة عبر النظام`,
    notificationType: 'approval_required',
    urgency: 'high'
  })
}
