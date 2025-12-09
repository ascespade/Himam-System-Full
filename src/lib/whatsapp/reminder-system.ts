/**
 * WhatsApp Reminder System
 * Send appointment reminders via WhatsApp
 */

import { sendTextMessage } from '../whatsapp-messaging'
import { patientRepository } from '@/infrastructure/supabase/repositories'
import { supabaseAdmin } from '../supabase'
import { notifyGuardiansAboutAppointment } from './guardian-notifications'

/**
 * Send appointment reminder
 */
export async function sendAppointmentReminder(appointmentId: string): Promise<void> {
  try {
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()

    if (!appointment) {
      console.error(`Appointment ${appointmentId} not found`)
      return
    }

    // Find patient by phone
    const patient = await patientRepository.findByPhone(appointment.phone)

    if (!patient) {
      console.error(`Patient with phone ${appointment.phone} not found`)
      return
    }

    // Format appointment date and time
    const appointmentDate = new Date(appointment.date)
    const dateStr = appointmentDate.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const timeStr = appointmentDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Send reminder to patient
    const reminderMessage = `⏰ تذكير بالموعد

مرحباً ${patient.name},

نذكرك بموعدك القادم:
📅 التاريخ: ${dateStr}
🕐 الوقت: ${timeStr}
👨‍⚕️ الأخصائي: ${appointment.specialist}

نرجو الحضور في الوقت المحدد.

شكراً لثقتك بنا.`

    await sendTextMessage(appointment.phone, reminderMessage)

    // Notify guardians if patient has guardians
    try {
      const { guardianRepository } = await import('@/infrastructure/supabase/repositories')
      const relationships = await guardianRepository.getPatientGuardians(patient.id)
      if (relationships.length > 0) {
        await notifyGuardiansAboutAppointment(
          patient.id,
          dateStr,
          timeStr,
          appointment.specialist
        )
      }
    } catch (error) {
      console.error('Error notifying guardians:', error)
    }
  } catch (error) {
    console.error('Error sending appointment reminder:', error)
  }
}

/**
 * Send reminder for all upcoming appointments (to be called by cron)
 */
export async function sendUpcomingAppointmentReminders(): Promise<void> {
  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    // Get appointments 24-48 hours from now
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('id, date, phone, patient_name, specialist')
      .gte('date', tomorrow.toISOString())
      .lt('date', dayAfterTomorrow.toISOString())
      .eq('status', 'pending')

    if (!appointments || appointments.length === 0) {
      return
    }

    // Send reminders
    for (const appointment of appointments) {
      await sendAppointmentReminder(appointment.id)
    }

    console.log(`Sent ${appointments.length} appointment reminders`)
  } catch (error) {
    console.error('Error sending upcoming appointment reminders:', error)
  }
}
