/**
 * Appointment Validation Schemas
 */

import { z } from 'zod'
import { uuidSchema, dateSchema } from './common.validations'

/**
 * Create appointment schema
 */
export const createAppointmentSchema = z.object({
  patient_id: uuidSchema,
  doctor_id: uuidSchema,
  date: dateSchema,
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'تنسيق الوقت غير صحيح (HH:MM)'),
  appointment_type: z.string().min(1),
  notes: z.string().optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

/**
 * Update appointment schema
 */
export const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  id: uuidSchema,
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
})

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
