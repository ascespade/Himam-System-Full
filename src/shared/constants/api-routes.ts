/**
 * API Routes Constants
 * Centralized API endpoint definitions
 */

export const API_ROUTES = {
  // Users
  USERS: '/api/users',
  USER: (id: string) => `/api/users/${id}`,

  // Appointments
  APPOINTMENTS: '/api/appointments',
  APPOINTMENT: (id: string) => `/api/appointments/${id}`,

  // Patients
  PATIENTS: '/api/patients',
  PATIENT: (id: string) => `/api/patients/${id}`,
  PATIENT_MEDICAL_FILE: (id: string) => `/api/patients/${id}/medical-file`,
  PATIENT_INSURANCE: (id: string) => `/api/patients/${id}/insurance`,

  // Doctors
  DOCTOR_PROFILE: '/api/doctor/profile',
  DOCTOR_PATIENTS: '/api/doctor/patients',
  DOCTOR_PATIENT: (id: string) => `/api/doctor/patients/${id}`,
  DOCTOR_APPOINTMENTS: '/api/doctor/appointments',
  DOCTOR_SESSIONS: '/api/doctor/sessions',
  DOCTOR_SESSION: (id: string) => `/api/doctor/sessions/${id}`,
  DOCTOR_QUEUE: '/api/doctor/queue',
  DOCTOR_SCHEDULE: '/api/doctor/schedule',
  DOCTOR_CURRENT_PATIENT: '/api/doctor/current-patient',
  DOCTOR_VIDEO_SETTINGS: '/api/doctor/video-settings',
  DOCTOR_ANALYTICS: '/api/doctor/analytics',

  // Reception
  RECEPTION_QUEUE: '/api/reception/queue',
  RECEPTION_QUEUE_ITEM: (id: string) => `/api/reception/queue/${id}`,

  // Billing
  BILLING: '/api/billing',
  BILLING_INVOICES: '/api/billing/invoices',
  BILLING_INVOICE: (id: string) => `/api/billing/invoices/${id}`,

  // WhatsApp
  WHATSAPP: '/api/whatsapp',
  WHATSAPP_TEMPLATES: '/api/whatsapp/templates',
  WHATSAPP_TEMPLATE: (id: string) => `/api/whatsapp/templates/${id}`,
  WHATSAPP_CONVERSATIONS: '/api/whatsapp/conversations',
  WHATSAPP_CONVERSATION: (id: string) => `/api/whatsapp/conversations/${id}`,
  WHATSAPP_MESSAGES: '/api/whatsapp/messages',
  WHATSAPP_ANALYTICS: '/api/whatsapp/analytics',

  // Settings
  SETTINGS: '/api/settings',

  // AI
  AI: '/api/ai',
  AI_DOCTOR_ASSISTANT: '/api/ai/doctor-assistant',

  // Calendar
  CALENDAR: '/api/calendar',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATION: (id: string) => `/api/notifications/${id}`,
  NOTIFICATIONS_MARK_ALL_READ: '/api/notifications/mark-all-read',

  // Reports
  REPORTS_STATS: '/api/reports/stats',

  // Guardian
  GUARDIAN_PATIENTS: '/api/guardian/patients',
  GUARDIAN_PATIENT: (id: string) => `/api/guardian/patients/${id}`,
  GUARDIAN_APPROVE_PROCEDURE: '/api/guardian/approve-procedure',

  // Supervisor
  SUPERVISOR_DASHBOARD: '/api/supervisor/dashboard',
  SUPERVISOR_REVIEWS: '/api/supervisor/reviews',
  SUPERVISOR_QUALITY: '/api/supervisor/quality',
  SUPERVISOR_CRITICAL_CASES: '/api/supervisor/critical-cases',
} as const
