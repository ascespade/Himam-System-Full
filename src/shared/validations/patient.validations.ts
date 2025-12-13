/**
 * Patient Validation Schemas
 * Includes input sanitization for XSS protection
 */

import { z } from 'zod'
import { saudiPhoneSchema, dateSchema } from './common.validations'
import { sanitizeText, sanitizePhone } from '@/core/security/sanitize'

/**
 * Create patient schema with sanitization
 */
export const createPatientSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين').max(100).transform(sanitizeText),
  phone: saudiPhoneSchema.transform(sanitizePhone),
  date_of_birth: dateSchema.optional(),
  gender: z.enum(['male', 'female']).optional(),
  nationality: z.string().optional().transform((val) => val ? sanitizeText(val) : val),
  address: z.string().optional().transform((val) => val ? sanitizeText(val) : val),
  emergency_contact_name: z.string().optional().transform((val) => val ? sanitizeText(val) : val),
  emergency_contact_phone: saudiPhoneSchema.optional().transform((val) => val ? sanitizePhone(val) : val),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>

/**
 * Update patient schema
 */
export const updatePatientSchema = createPatientSchema.partial()

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
