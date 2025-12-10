/**
 * Form Validation Helpers
 * Utility functions for form validation
 */

import { z } from 'zod'
import type { FormError } from './use-form'

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates form data against a Zod schema
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { isValid: boolean; errors: FormError[]; data?: T } {
  try {
    const validated = schema.parse(data)
    return {
      isValid: true,
      errors: [],
      data: validated,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formErrors: FormError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      return {
        isValid: false,
        errors: formErrors,
      }
    }

    return {
      isValid: false,
      errors: [{ field: 'root', message: 'Validation failed' }],
    }
  }
}

/**
 * Gets error message for a specific field
 */
export function getFieldError(errors: FormError[], fieldName: string): string | undefined {
  return errors.find(err => err.field === fieldName)?.message
}

/**
 * Checks if a field has an error
 */
export function hasFieldError(errors: FormError[], fieldName: string): boolean {
  return errors.some(err => err.field === fieldName)
}

/**
 * Clears errors for a specific field
 */
export function clearFieldError(errors: FormError[], fieldName: string): FormError[] {
  return errors.filter(err => err.field !== fieldName)
}

/**
 * Clears all errors
 */
export function clearAllErrors(): FormError[] {
  return []
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates phone number (Saudi format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+966[0-9]{9}$/
  return phoneRegex.test(phone)
}

/**
 * Validates required field
 */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

/**
 * Validates minimum length
 */
export function minLength(value: string, min: number): boolean {
  return value.length >= min
}

/**
 * Validates maximum length
 */
export function maxLength(value: string, max: number): boolean {
  return value.length <= max
}

/**
 * Validates number range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}
