/**
 * Permission/RBAC System
 * Centralized permission definitions and checks
 */

import type { UserRole } from '@/core/api/middleware'

// Custom error for permissions
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

// ============================================================================
// Permission Definitions
// ============================================================================

export const Permissions = {
  // Appointments
  APPOINTMENTS: {
    CREATE: 'appointments:create',
    READ: 'appointments:read',
    UPDATE: 'appointments:update',
    DELETE: 'appointments:delete',
    CANCEL: 'appointments:cancel',
  },

  // Patients
  PATIENTS: {
    CREATE: 'patients:create',
    READ: 'patients:read',
    UPDATE: 'patients:update',
    DELETE: 'patients:delete',
    VIEW_MEDICAL_RECORDS: 'patients:view_medical_records',
  },

  // Users
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    MANAGE_ROLES: 'users:manage_roles',
  },

  // Billing
  BILLING: {
    CREATE: 'billing:create',
    READ: 'billing:read',
    UPDATE: 'billing:update',
    DELETE: 'billing:delete',
    PROCESS_PAYMENT: 'billing:process_payment',
  },

  // Settings
  SETTINGS: {
    READ: 'settings:read',
    UPDATE: 'settings:update',
    MANAGE_SYSTEM: 'settings:manage_system',
  },

  // Reports
  REPORTS: {
    VIEW: 'reports:view',
    EXPORT: 'reports:export',
    ANALYTICS: 'reports:analytics',
  },

  // WhatsApp
  WHATSAPP: {
    SEND: 'whatsapp:send',
    READ_CONVERSATIONS: 'whatsapp:read_conversations',
    MANAGE_TEMPLATES: 'whatsapp:manage_templates',
    VIEW_ANALYTICS: 'whatsapp:view_analytics',
  },
} as const

// ============================================================================
// Role-Permission Mapping
// ============================================================================

const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    // All permissions
    ...Object.values(Permissions.APPOINTMENTS),
    ...Object.values(Permissions.PATIENTS),
    ...Object.values(Permissions.USERS),
    ...Object.values(Permissions.BILLING),
    ...Object.values(Permissions.SETTINGS),
    ...Object.values(Permissions.REPORTS),
    ...Object.values(Permissions.WHATSAPP),
  ],
  doctor: [
    Permissions.APPOINTMENTS.READ,
    Permissions.APPOINTMENTS.UPDATE,
    Permissions.PATIENTS.READ,
    Permissions.PATIENTS.VIEW_MEDICAL_RECORDS,
    Permissions.BILLING.READ,
    Permissions.REPORTS.VIEW,
    Permissions.REPORTS.ANALYTICS,
  ],
  patient: [
    Permissions.APPOINTMENTS.READ,
    Permissions.APPOINTMENTS.CREATE,
    Permissions.PATIENTS.READ,
    Permissions.BILLING.READ,
  ],
  reception: [
    Permissions.APPOINTMENTS.CREATE,
    Permissions.APPOINTMENTS.READ,
    Permissions.APPOINTMENTS.UPDATE,
    Permissions.PATIENTS.CREATE,
    Permissions.PATIENTS.READ,
    Permissions.PATIENTS.UPDATE,
    Permissions.BILLING.CREATE,
    Permissions.BILLING.READ,
    Permissions.BILLING.UPDATE,
    Permissions.BILLING.PROCESS_PAYMENT,
  ],
  staff: [
    Permissions.APPOINTMENTS.READ,
    Permissions.APPOINTMENTS.UPDATE,
    Permissions.PATIENTS.READ,
    Permissions.BILLING.READ,
  ],
  guardian: [
    Permissions.PATIENTS.READ,
    Permissions.APPOINTMENTS.READ,
  ],
  supervisor: [
    Permissions.APPOINTMENTS.READ,
    Permissions.PATIENTS.READ,
    Permissions.REPORTS.VIEW,
    Permissions.REPORTS.ANALYTICS,
  ],
}

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Checks if a user role has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = rolePermissions[userRole] || []
  return permissions.includes(permission)
}

/**
 * Requires a specific permission (throws if not granted)
 */
export function requirePermission(permission: string) {
  return (userRole: UserRole) => {
    if (!hasPermission(userRole, permission)) {
      throw new ForbiddenError(`Insufficient permissions: ${permission}`)
    }
  }
}

/**
 * Checks if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Checks if user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}
