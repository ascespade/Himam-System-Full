/**
 * Validation Utilities
 * Centralized validation functions for forms and data
 */

import { VALIDATION, ERROR_MESSAGES } from '../constants'

// ============================================================================
// Field Validators
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED }
  }
  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_EMAIL }
  }
  return { isValid: true }
}

/**
 * Validates phone number
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED }
  }
  if (!VALIDATION.PHONE_REGEX.test(phone)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_PHONE }
  }
  return { isValid: true }
}

/**
 * Validates required field
 */
export function validateRequired(value: any, fieldName?: string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: fieldName ? `${fieldName} ${ERROR_MESSAGES.REQUIRED}` : ERROR_MESSAGES.REQUIRED,
    }
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return {
      isValid: false,
      error: fieldName ? `${fieldName} ${ERROR_MESSAGES.REQUIRED}` : ERROR_MESSAGES.REQUIRED,
    }
  }
  return { isValid: true }
}

/**
 * Validates string length
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number
): ValidationResult {
  if (min !== undefined && value.length < min) {
    return {
      isValid: false,
      error: `يجب أن يكون طول النص على الأقل ${min} حرف`,
    }
  }
  if (max !== undefined && value.length > max) {
    return {
      isValid: false,
      error: `يجب أن يكون طول النص على الأكثر ${max} حرف`,
    }
  }
  return { isValid: true }
}

/**
 * Validates number range
 */
export function validateNumber(
  value: number,
  min?: number,
  max?: number
): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: 'يجب أن يكون رقماً' }
  }
  if (min !== undefined && value < min) {
    return { isValid: false, error: `يجب أن يكون الرقم على الأقل ${min}` }
  }
  if (max !== undefined && value > max) {
    return { isValid: false, error: `يجب أن يكون الرقم على الأكثر ${max}` }
  }
  return { isValid: true }
}

/**
 * Validates date
 */
export function validateDate(date: string | Date): ValidationResult {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'تاريخ غير صحيح' }
  }
  return { isValid: true }
}

/**
 * Validates future date
 */
export function validateFutureDate(date: string | Date): ValidationResult {
  const dateValidation = validateDate(date)
  if (!dateValidation.isValid) {
    return dateValidation
  }
  const dateObj = new Date(date)
  if (dateObj <= new Date()) {
    return { isValid: false, error: 'يجب أن يكون التاريخ في المستقبل' }
  }
  return { isValid: true }
}

// ============================================================================
// Combined Validators
// ============================================================================

/**
 * Validates multiple fields
 */
export function validateFields<T extends Record<string, any>>(
  data: T,
  validators: Partial<Record<keyof T, (value: any) => ValidationResult>>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {}
  
  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      const result = validator(data[field])
      if (!result.isValid && result.error) {
        errors[field as keyof T] = result.error
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

