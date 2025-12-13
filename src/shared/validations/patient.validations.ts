/**
 * Patient Validation Schemas
 */

import { z } from 'zod'
import { saudiPhoneSchema, dateSchema } from './common.validations'

/**
 * Create patient schema
 */
export const createPatientSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين').max(100),
  phone: saudiPhoneSchema,
  date_of_birth: dateSchema.optional(),
  gender: z.enum(['male', 'female']).optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: saudiPhoneSchema.optional(),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>

/**
 * Update patient schema
 */
export const updatePatientSchema = createPatientSchema.partial()

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
