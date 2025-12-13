/**
 * Invoice Validation Schemas
 */

import { z } from 'zod'
import { uuidSchema } from './common.validations'

/**
 * Invoice item schema
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'الوصف مطلوب'),
  quantity: z.number().int().min(1, 'الكمية يجب أن تكون على الأقل 1'),
  price: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي 0'),
})

/**
 * Create invoice schema
 */
export const createInvoiceSchema = z.object({
  patient_id: uuidSchema,
  items: z.array(invoiceItemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
  notes: z.string().optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

/**
 * Update invoice schema
 */
export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: uuidSchema,
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
})

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
