/**
 * Email Types
 * Type definitions for email system
 */

export type EmailTemplate = 'welcome' | 'appointment-confirmation' | 'password-reset'

export interface EmailTemplateData {
  // Welcome template
  name?: string
  email?: string
  loginUrl?: string

  // Appointment confirmation template
  patientName?: string
  date?: string
  time?: string
  doctorName?: string
  notes?: string

  // Password reset template
  resetUrl?: string
  expiryHours?: number
}
