/**
 * Common Validation Schemas
 * Shared Zod schemas for common data types
 */

import { z } from 'zod'

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('البريد الإلكتروني غير صحيح')

/**
 * Saudi phone number validation
 */
export const saudiPhoneSchema = z.string().regex(
  /^(\+966|00966|966|0)?[5][0-9]{8}$/,
  'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05)'
)

/**
 * Date validation schema
 */
export const dateSchema = z.coerce.date().max(new Date(), 'التاريخ لا يمكن أن يكون في المستقبل')

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('معرف غير صحيح')

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Sort schema
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

/**
 * Search schema
 */
export const searchSchema = z.object({
  q: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
})
