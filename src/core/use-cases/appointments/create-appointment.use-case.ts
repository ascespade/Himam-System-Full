/**
 * Create Appointment Use Case
 * Encapsulates business logic for creating appointments
 */

import { BaseUseCase, type UseCaseResult, type UseCaseInput } from '../base.use-case'
import { appointmentService, type CreateAppointmentInput } from '@/core/services/appointment.service'
import { type Appointment } from '@/infrastructure/supabase/repositories/appointment.repository'

export interface CreateAppointmentUseCaseInput extends UseCaseInput {
  patient_id?: string | null
  patient_name?: string | null
  phone?: string | null
  specialist: string
  date: string
  status?: string
  calendar_event_id?: string | null
  notes?: string | null
}

export class CreateAppointmentUseCase extends BaseUseCase<CreateAppointmentUseCaseInput, Appointment> {
  /**
   * Validates input before execution
   */
  protected validateInput(input: CreateAppointmentUseCaseInput): UseCaseResult<Appointment> | null {
    if (!input.specialist || !input.date) {
      return this.failure('Specialist and date are required', 'VALIDATION_ERROR')
    }

    // Validate date is in the future
    const appointmentDate = new Date(input.date)
    if (appointmentDate < new Date()) {
      return this.failure('Appointment date must be in the future', 'VALIDATION_ERROR')
    }

    return null // Validation passed
  }

  /**
   * Executes the use case
   */
  async execute(input: CreateAppointmentUseCaseInput): Promise<UseCaseResult<Appointment>> {
    try {
      // Validate input
      const validation = this.validateInput(input)
      if (validation) {
        return validation
      }

      // Create appointment via service
      const serviceInput: CreateAppointmentInput = {
        patient_id: input.patient_id,
        patient_name: input.patient_name,
        phone: input.phone,
        specialist: input.specialist,
        date: input.date,
        status: input.status,
        calendar_event_id: input.calendar_event_id,
        notes: input.notes,
      }

      const result = await appointmentService.createAppointment(serviceInput)

      if (!result.success || !result.data) {
        return this.failure(
          result.error || 'Failed to create appointment',
          result.code
        )
      }

      return this.success(result.data, {
        appointmentId: result.data.id,
        patientId: result.data.patient_id,
      })
    } catch (error: unknown) {
      return this.handleError(error, { input })
    }
  }
}

export const createAppointmentUseCase = new CreateAppointmentUseCase()

