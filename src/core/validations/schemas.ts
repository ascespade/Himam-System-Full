/**
 * Validation Schemas
 * Centralized Zod schemas for all entities
 */

import { z } from 'zod'

// ============================================================================
// Common Schemas
// ============================================================================

export const emailSchema = z.string().email('البريد الإلكتروني غير صحيح')
export const phoneSchema = z.string().regex(/^\+966[0-9]{9}$/, 'رقم الهاتف غير صحيح')
export const uuidSchema = z.string().uuid('معرف غير صحيح')

// ============================================================================
// User Schemas
// ============================================================================

export const userRoleSchema = z.enum([
  'admin',
  'doctor',
  'patient',
  'staff',
  'reception',
  'guardian',
  'supervisor',
])

export const createUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  email: emailSchema,
  phone: phoneSchema,
  role: userRoleSchema,
  password: z.string().min(8, 'كلمة المرور يجب أن تكون على الأقل 8 أحرف'),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true })

// ============================================================================
// Appointment Schemas
// ============================================================================

export const appointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
])

export const appointmentTypeSchema = z.enum([
  'consultation',
  'follow_up',
  'emergency',
  'procedure',
  'checkup',
])

export const createAppointmentSchema = z.object({
  patient_id: uuidSchema,
  doctor_id: uuidSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'وقت غير صحيح').optional(),
  duration: z.number().int().min(15).max(180).default(30),
  appointment_type: appointmentTypeSchema.default('consultation'),
  notes: z.string().optional(),
  status: appointmentStatusSchema.default('scheduled'),
})

export const updateAppointmentSchema = createAppointmentSchema.partial()

// ============================================================================
// Patient Schemas
// ============================================================================

export const genderSchema = z.enum(['male', 'female', 'other'])

export const createPatientSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  email: emailSchema.optional(),
  phone: phoneSchema,
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الميلاد غير صحيح'),
  gender: genderSchema,
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: phoneSchema.optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
})

export const updatePatientSchema = createPatientSchema.partial()

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const dateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
