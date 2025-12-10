/**
 * Cache Keys
 * Centralized cache key constants
 */

// ============================================================================
// Cache Key Generators
// ============================================================================

export const CacheKeys = {
  // Users
  USER: (id: string) => `user:${id}`,
  USERS_BY_ROLE: (role: string) => `users:role:${role}`,
  USER_SEARCH: (query: string) => `users:search:${query}`,

  // Patients
  PATIENT: (id: string) => `patient:${id}`,
  PATIENTS_SEARCH: (query: string) => `patients:search:${query}`,
  PATIENT_APPOINTMENTS: (patientId: string) => `patient:${patientId}:appointments`,

  // Appointments
  APPOINTMENT: (id: string) => `appointment:${id}`,
  APPOINTMENTS_BY_DOCTOR: (doctorId: string, date?: string) =>
    `appointments:doctor:${doctorId}${date ? `:${date}` : ''}`,
  APPOINTMENTS_BY_PATIENT: (patientId: string) => `appointments:patient:${patientId}`,
  APPOINTMENTS_BY_DATE: (date: string) => `appointments:date:${date}`,

  // Settings
  SETTINGS: 'settings:all',
  SETTING: (key: string) => `settings:${key}`,

  // Notifications
  NOTIFICATIONS: (userId: string) => `notifications:user:${userId}`,
  NOTIFICATIONS_UNREAD_COUNT: (userId: string) => `notifications:user:${userId}:unread`,

  // Statistics
  STATS_DASHBOARD: (role: string) => `stats:dashboard:${role}`,
  STATS_APPOINTMENTS: (date: string) => `stats:appointments:${date}`,

  // WhatsApp
  WHATSAPP_TEMPLATES: 'whatsapp:templates',
  WHATSAPP_CONVERSATION: (phone: string) => `whatsapp:conversation:${phone}`,
} as const

// ============================================================================
// Cache Tags
// ============================================================================

export const CacheTags = {
  USERS: 'users',
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  STATS: 'stats',
  WHATSAPP: 'whatsapp',
} as const
