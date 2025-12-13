/**
 * Appointment Service
 * Business logic for appointment management
 * Uses AppointmentRepository for data access
 */

import { BaseService, type ServiceResult, type PaginatedServiceResult } from './base.service'
import { appointmentRepository, type Appointment } from '@/infrastructure/supabase/repositories/appointment.repository'
import { logInfo } from '@/shared/utils/logger'

export interface CreateAppointmentInput {
  patient_id?: string | null
  patient_name?: string | null
  phone?: string | null
  specialist: string
  date: string
  status?: string
  calendar_event_id?: string | null
  notes?: string | null
}

export interface UpdateAppointmentInput {
  patient_id?: string | null
  patient_name?: string | null
  phone?: string | null
  specialist?: string
  date?: string
  status?: string
  calendar_event_id?: string | null
  notes?: string | null
}

export class AppointmentService extends BaseService {
  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string): Promise<ServiceResult<Appointment | null>> {
    this.logOperation('getAppointmentById', { id })
    const result = await this.execute(
      () => appointmentRepository.findById(id),
      'Failed to fetch appointment',
      { id }
    )
    
    if (result.success && result.data === null) {
      return {
        success: false,
        error: 'Appointment not found',
        code: 'NOT_FOUND',
      }
    }
    
    return result as ServiceResult<Appointment>
  }

  /**
   * Get appointments by patient ID
   */
  async getAppointmentsByPatientId(patientId: string): Promise<ServiceResult<Appointment[]>> {
    this.logOperation('getAppointmentsByPatientId', { patientId })
    return this.execute(
      () => appointmentRepository.findByPatientId(patientId),
      'Failed to fetch patient appointments',
      { patientId }
    )
  }

  /**
   * Create new appointment
   */
  async createAppointment(input: CreateAppointmentInput): Promise<ServiceResult<Appointment>> {
    this.logOperation('createAppointment', { input })
    
    const appointmentData = {
      patient_id: input.patient_id || null,
      patient_name: input.patient_name || null,
      phone: input.phone || null,
      specialist: input.specialist,
      date: input.date,
      status: input.status || 'pending',
      calendar_event_id: input.calendar_event_id || null,
      notes: input.notes || null,
    }

    return this.execute(
      () => appointmentRepository.create(appointmentData),
      'Failed to create appointment',
      { input }
    )
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    id: string,
    input: UpdateAppointmentInput
  ): Promise<ServiceResult<Appointment>> {
    this.logOperation('updateAppointment', { id, input })
    
    // Convert UpdateAppointmentInput to Partial<Appointment>
    const updateData: Partial<Appointment> = {}
    if (input.patient_id !== undefined) updateData.patient_id = input.patient_id
    if (input.patient_name !== undefined) updateData.patient_name = input.patient_name
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.specialist !== undefined) updateData.specialist = input.specialist
    if (input.date !== undefined) updateData.date = input.date
    if (input.status !== undefined) updateData.status = input.status
    if (input.calendar_event_id !== undefined) updateData.calendar_event_id = input.calendar_event_id
    if (input.notes !== undefined) updateData.notes = input.notes
    
    return this.execute(
      () => appointmentRepository.update(id, updateData),
      'Failed to update appointment',
      { id, input }
    )
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(id: string): Promise<ServiceResult<boolean>> {
    this.logOperation('deleteAppointment', { id })
    return this.execute(
      () => appointmentRepository.delete(id),
      'Failed to delete appointment',
      { id }
    )
  }

  /**
   * Get paginated appointments
   */
  async getAppointments(
    page: number = 1,
    limit: number = 50,
    filters?: Record<string, unknown>
  ): Promise<PaginatedServiceResult<Appointment>> {
    this.logOperation('getAppointments', { page, limit, filters })
    
    try {
      const result = await appointmentRepository.getPaginated({ page, limit }, filters)
      
      return {
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      }
    } catch (error: unknown) {
      logInfo('Failed to get paginated appointments', { error, page, limit })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointments',
        code: 'FETCH_ERROR',
      }
    }
  }
}

export const appointmentService = new AppointmentService()
