/**
 * Appointment Service
 * Business logic for appointment management
 */

import { BaseService, ServiceException } from './base.service'
import { createAppointmentSchema, updateAppointmentSchema, type CreateAppointmentInput, type UpdateAppointmentInput } from '@/core/validations/schemas'
import type { Appointment } from '@/shared/types'

export class AppointmentService extends BaseService {
  /**
   * Creates a new appointment
   */
  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const validated = createAppointmentSchema.parse(input)

    // Check for conflicts
    const conflicts = await this.checkConflicts(validated)
    if (conflicts.length > 0) {
      throw new ServiceException(
        `Appointment conflicts with existing appointments: ${conflicts.map(c => c.id).join(', ')}`,
        'CONFLICT'
      )
    }

    // Create appointment
    const { data: appointment, error } = await this.supabase
      .from('appointments')
      .insert({
        patient_id: validated.patient_id,
        doctor_id: validated.doctor_id,
        date: validated.date,
        time: validated.time,
        duration: validated.duration,
        appointment_type: validated.appointment_type,
        notes: validated.notes,
        status: validated.status,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw this.handleError(error, 'createAppointment')
    }

    return this.requireData(appointment, 'Failed to create appointment')
  }

  /**
   * Updates an appointment
   */
  async updateAppointment(appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const validated = updateAppointmentSchema.parse(input)

    // Check for conflicts if date/time is being changed
    if (validated.date || validated.time) {
      const existing = await this.findById(appointmentId)
      if (!existing) {
        throw new ServiceException('Appointment not found', 'NOT_FOUND')
      }

      const checkInput = {
        ...existing,
        ...validated,
      }
      const conflicts = await this.checkConflicts(checkInput as CreateAppointmentInput, appointmentId)
      if (conflicts.length > 0) {
        throw new ServiceException('Appointment conflicts with existing appointments', 'CONFLICT')
      }
    }

    const { data: appointment, error } = await this.supabase
      .from('appointments')
      .update(validated)
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) {
      throw this.handleError(error, 'updateAppointment')
    }

    return this.requireData(appointment, 'Appointment not found')
  }

  /**
   * Finds an appointment by ID
   */
  async findById(appointmentId: string): Promise<Appointment | null> {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw this.handleError(error, 'findById')
    }

    return data
  }

  /**
   * Finds appointments by patient ID
   */
  async findByPatientId(patientId: string, page = 1, limit = 50): Promise<{ data: Appointment[]; total: number }> {
    const offset = (page - 1) * limit

    const { data, error, count } = await this.supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw this.handleError(error, 'findByPatientId')
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }

  /**
   * Finds appointments by doctor ID
   */
  async findByDoctorId(doctorId: string, page = 1, limit = 50): Promise<{ data: Appointment[]; total: number }> {
    const offset = (page - 1) * limit

    const { data, error, count } = await this.supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw this.handleError(error, 'findByDoctorId')
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }

  /**
   * Checks for appointment conflicts
   */
  private async checkConflicts(
    input: CreateAppointmentInput,
    excludeId?: string
  ): Promise<Appointment[]> {
    if (!input.doctor_id || !input.date || !input.time) {
      return []
    }

    const startTime = new Date(`${input.date}T${input.time}`)
    const endTime = new Date(startTime.getTime() + (input.duration || 30) * 60000)

    let query = this.supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', input.doctor_id)
      .eq('date', input.date)
      .in('status', ['scheduled', 'confirmed'])

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: appointments, error } = await query

    if (error) {
      throw this.handleError(error, 'checkConflicts')
    }

    if (!appointments) return []

    // Check for time overlaps
    return appointments.filter(apt => {
      if (!apt.time) return false
      const aptStart = new Date(`${apt.date}T${apt.time}`)
      const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000)

      return (
        (startTime >= aptStart && startTime < aptEnd) ||
        (endTime > aptStart && endTime <= aptEnd) ||
        (startTime <= aptStart && endTime >= aptEnd)
      )
    })
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService()
