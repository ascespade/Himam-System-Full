/**
 * Route Paths Constants
 * Centralized route definitions for navigation
 */

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  LOGOUT: '/logout',

  // Dashboard
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    DOCTOR: '/dashboard/doctor',
    PATIENT: '/dashboard/patient',
    RECEPTION: '/dashboard/reception',
    GUARDIAN: '/dashboard/guardian',
    SUPERVISOR: '/dashboard/supervisor',
  },

  // Admin Routes
  ADMIN: {
    DASHBOARD: '/dashboard/admin',
    REPORTS: '/dashboard/reports',
    DOCTORS: '/dashboard/doctors',
    PATIENTS: '/dashboard/patients',
    USERS: '/dashboard/users',
    CONTENT: '/dashboard/content',
    KNOWLEDGE: '/dashboard/knowledge',
    WHATSAPP: '/dashboard/admin/whatsapp',
    WHATSAPP_TEMPLATES: '/dashboard/admin/whatsapp/templates',
    WHATSAPP_PROFILE: '/dashboard/admin/whatsapp/profile',
    WHATSAPP_LIVE: '/dashboard/admin/whatsapp/live',
    WHATSAPP_ANALYTICS: '/dashboard/admin/whatsapp/analytics',
    WORKFLOWS: '/dashboard/admin/workflows',
    MONITOR: '/dashboard/admin/monitor',
    SETTINGS: '/dashboard/admin/settings',
  },

  // Doctor Routes
  DOCTOR: {
    DASHBOARD: '/dashboard/doctor',
    CURRENT_PATIENT: '/dashboard/doctor/current-patient',
    PATIENTS: '/dashboard/doctor/patients',
    PATIENT: (id: string) => `/dashboard/doctor/patients/${id}`,
    SCHEDULE: '/dashboard/doctor/schedule',
    SCHEDULE_WORKING_HOURS: '/dashboard/doctor/schedule/working-hours',
    APPOINTMENTS: '/dashboard/doctor/appointments',
    QUEUE: '/dashboard/doctor/queue',
    SESSIONS: '/dashboard/doctor/sessions',
    SESSION_NEW: '/dashboard/doctor/sessions/new',
    VIDEO_SESSIONS: '/dashboard/doctor/video-sessions',
    VIDEO_SESSIONS_SETTINGS: '/dashboard/doctor/video-sessions/settings',
    RECORDINGS: '/dashboard/doctor/recordings',
    TREATMENT_PLANS: '/dashboard/doctor/treatment-plans',
    MEDICAL_RECORDS: '/dashboard/doctor/medical-records',
    PROGRESS: '/dashboard/doctor/progress',
    AI_ASSISTANT: '/dashboard/doctor/ai-assistant',
    TEMPLATES: '/dashboard/doctor/templates',
    AUTO_DOCUMENTATION: '/dashboard/doctor/auto-documentation',
    ANALYTICS: '/dashboard/doctor/analytics',
    REPORTS: '/dashboard/doctor/reports',
    SEARCH: '/dashboard/doctor/search',
    INSURANCE_AI_AGENT: '/dashboard/doctor/insurance/ai-agent',
    INSURANCE_CLAIMS: '/dashboard/doctor/insurance/claims',
    SETTINGS: '/dashboard/doctor/settings',
    SETTINGS_CLINIC: '/dashboard/doctor/settings/clinic',
  },

  // Reception Routes
  RECEPTION: {
    DASHBOARD: '/dashboard/reception',
    QUEUE: '/dashboard/reception/queue',
    PATIENTS: '/dashboard/reception/patients',
    PATIENT_NEW: '/dashboard/reception/patients/new',
    APPOINTMENTS: '/dashboard/reception/appointments',
    BOOK_APPOINTMENT: '/dashboard/reception/book-appointment',
    BILLING: '/dashboard/reception/billing',
    INSURANCE: '/dashboard/reception/insurance',
    REPORTS: '/dashboard/reception/reports',
    SETTINGS: '/dashboard/reception/settings',
  },

  // Patient Routes
  PATIENT: {
    DASHBOARD: '/dashboard/patient',
    APPOINTMENTS: '/dashboard/patient/appointments',
    RECORDS: '/dashboard/patient/records',
    MEDICATIONS: '/dashboard/patient/medications',
    PRESCRIPTIONS: '/dashboard/patient/prescriptions',
    LAB_RESULTS: '/dashboard/patient/lab-results',
    TREATMENT_PLANS: '/dashboard/patient/treatment-plans',
    PROGRESS: '/dashboard/patient/progress',
    DOCUMENTS: '/dashboard/patient/documents',
    BILLING: '/dashboard/patient/billing',
    SETTINGS: '/dashboard/patient/settings',
  },

  // Guardian Routes
  GUARDIAN: {
    DASHBOARD: '/dashboard/guardian',
    PATIENTS: '/dashboard/guardian/patients',
    APPROVALS: '/dashboard/guardian/approvals',
  },

  // Supervisor Routes
  SUPERVISOR: {
    DASHBOARD: '/dashboard/supervisor',
    REVIEWS: '/dashboard/supervisor/reviews',
    QUALITY: '/dashboard/supervisor/quality',
    CRITICAL_CASES: '/dashboard/supervisor/critical-cases',
  },

  // Shared Routes
  SHARED: {
    CALENDAR: '/dashboard/calendar',
    CHAT: '/dashboard/chat',
  },
} as const
