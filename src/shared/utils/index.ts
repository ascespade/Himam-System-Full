/**
 * Centralized Utility Functions
 * Reusable helper functions used across the application
 */

// Re-export validation utilities
export * from './validation'

// Re-export logger
export * from './logger'

// ============================================================================
// Class Name Utilities
// ============================================================================

/**
 * Combines class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================================================
// Date/Time Utilities
// ============================================================================

/**
 * Formats a date to Arabic locale
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formats time to Arabic locale
 */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats date and time together
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} - ${formatTime(date)}`
}

/**
 * Checks if a date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  return new Date(date) < new Date()
}

/**
 * Checks if a date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  return new Date(date) > new Date()
}

// ============================================================================
// Validation Utilities
// ============================================================================

import { VALIDATION } from '../constants'

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION.EMAIL_REGEX.test(email)
}

/**
 * Validates Saudi phone number
 */
export function isValidPhone(phone: string): boolean {
  return VALIDATION.PHONE_REGEX.test(phone)
}

/**
 * Validates required field
 */
export function isRequired(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncates text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Capitalizes first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Converts string to slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================================
// Number Utilities
// ============================================================================

/**
 * Formats number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num)
}

/**
 * Formats currency
 */
export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
  }).format(amount)
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Removes duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Groups array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Type guard: Checks if value is a plain object
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Deep merges two objects with proper type safety
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target } as T
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceKey = key as keyof T
      const sourceValue = source[sourceKey]
      
      if (sourceValue === undefined) return
      
      if (isObject(sourceValue) && isObject(target[sourceKey])) {
        output[sourceKey] = deepMerge(
          target[sourceKey] as Record<string, unknown>,
          sourceValue as Partial<Record<string, unknown>>
        ) as T[keyof T]
      } else {
        output[sourceKey] = sourceValue as T[keyof T]
      }
    })
  }
  
  return output
}

/**
 * Removes undefined/null values from object
 * Returns a new object with only defined values
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null)
  ) as Partial<T>
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Delays execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retries a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt)
      }
    }
  }
  
  throw lastError!
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Extracts error message from error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || 'حدث خطأ غير متوقع'
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'حدث خطأ غير متوقع'
}

/**
 * Creates a safe error object with optional code
 * Note: AppError class is defined in @/shared/types/errors
 */
export function createError(message: string, code?: string, statusCode?: number): Error {
  const error = new Error(message)
  if (code) {
    (error as { code?: string }).code = code
  }
  if (statusCode) {
    (error as { statusCode?: number }).statusCode = statusCode
  }
  return error
}
