/**
 * Type Guards
 * Runtime type checking utilities
 */

import type { User, Appointment, Patient, Billing, MedicalRecord } from '@/shared/types'

// ============================================================================
// User Type Guards
// ============================================================================

export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    typeof (obj as User).email === 'string'
  )
}

export function isUserWithRole(obj: unknown): obj is User & { role: string } {
  return isUser(obj) && 'role' in obj && typeof (obj as User & { role: string }).role === 'string'
}

// ============================================================================
// Appointment Type Guards
// ============================================================================

export function isAppointment(obj: unknown): obj is Appointment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'date' in obj &&
    'status' in obj &&
    typeof (obj as Appointment).status === 'string'
  )
}

// ============================================================================
// Patient Type Guards
// ============================================================================

export function isPatient(obj: unknown): obj is Patient {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'phone' in obj &&
    typeof (obj as Patient).name === 'string'
  )
}

// ============================================================================
// Billing Type Guards
// ============================================================================

export function isBilling(obj: unknown): obj is Billing {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'patientName' in obj &&
    'amount' in obj &&
    typeof (obj as Billing).amount === 'number'
  )
}

// ============================================================================
// Medical Record Type Guards
// ============================================================================

export function isMedicalRecord(obj: unknown): obj is MedicalRecord {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'patientId' in obj &&
    'recordType' in obj &&
    typeof (obj as MedicalRecord).recordType === 'string'
  )
}

// ============================================================================
// Error Type Guards
// ============================================================================

export function isError(obj: unknown): obj is Error {
  return (
    obj instanceof Error ||
    (typeof obj === 'object' &&
      obj !== null &&
      'message' in obj &&
      typeof (obj as Error).message === 'string')
  )
}

export function isApiError(obj: unknown): obj is { success: false; error: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    (obj as { success: boolean }).success === false &&
    'error' in obj
  )
}

// ============================================================================
// Array Type Guards
// ============================================================================

export function isArray<T>(obj: unknown, guard: (item: unknown) => item is T): obj is T[] {
  return Array.isArray(obj) && obj.every(guard)
}

// ============================================================================
// String Type Guards
// ============================================================================

export function isString(obj: unknown): obj is string {
  return typeof obj === 'string'
}

export function isNonEmptyString(obj: unknown): obj is string {
  return typeof obj === 'string' && obj.trim().length > 0
}

// ============================================================================
// Number Type Guards
// ============================================================================

export function isNumber(obj: unknown): obj is number {
  return typeof obj === 'number' && !isNaN(obj)
}

export function isPositiveNumber(obj: unknown): obj is number {
  return isNumber(obj) && obj > 0
}

// ============================================================================
// Date Type Guards
// ============================================================================

export function isDate(obj: unknown): obj is Date {
  return obj instanceof Date && !isNaN(obj.getTime())
}

export function isDateString(obj: unknown): obj is string {
  if (typeof obj !== 'string') return false
  const date = new Date(obj)
  return !isNaN(date.getTime())
}
