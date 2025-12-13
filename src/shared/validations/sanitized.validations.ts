/**
 * Sanitized Validation Schemas
 * Zod schemas with built-in sanitization
 */

import { z } from 'zod'
import { sanitizeText, sanitizeHtml, sanitizeEmail, sanitizePhone, sanitizeUrl } from '@/core/security/sanitize'

/**
 * Sanitized string schema
 */
export const sanitizedString = z.string().transform(sanitizeText)

/**
 * Sanitized HTML schema
 */
export const sanitizedHtml = z.string().transform(sanitizeHtml)

/**
 * Sanitized email schema
 */
export const sanitizedEmail = z.string().email().transform(sanitizeEmail)

/**
 * Sanitized phone schema
 */
export const sanitizedPhone = z.string().transform(sanitizePhone)

/**
 * Sanitized URL schema
 */
export const sanitizedUrl = z.string().url().transform(sanitizeUrl)

/**
 * Example: Sanitized content schema
 */
export const sanitizedContentSchema = z.object({
  title: sanitizedString,
  description: sanitizedHtml,
  email: sanitizedEmail,
  phone: sanitizedPhone,
  website: sanitizedUrl.optional(),
})
