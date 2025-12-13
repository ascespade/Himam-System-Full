/**
 * Appointment Repository
 * Manages appointment data with BaseRepository pattern
 */

import { BaseRepository } from '@/core/repositories/base.repository'
import { supabaseAdmin } from '@/lib'
import { logError } from '@/shared/utils/logger'

export interface Appointment extends Record<string, unknown> {
  id: string
  patient_id: string | null
  patient_name: string | null
  phone: string | null
  specialist: string | null
  date: string
  status: string
  calendar_event_id: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export class AppointmentRepository extends BaseRepository<Appointment> {
  protected readonly tableName = 'appointments'
  protected readonly selectFields = '*'

  /**
   * Map database row to entity
   */
  protected mapToEntity(row: unknown): Appointment {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      patient_id: (data.patient_id as string | null) || null,
      patient_name: (data.patient_name as string | null) || null,
      phone: (data.phone as string | null) || null,
      specialist: (data.specialist as string | null) || null,
      date: data.date as string,
      status: (data.status as string) || 'pending',
      calendar_event_id: (data.calendar_event_id as string | null) || null,
      notes: (data.notes as string | null) || null,
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string | null) || null,
    }
  }

  /**
   * Find appointment by ID
   */
  async findById(id: string): Promise<Appointment | null> {
    return this.getById(id)
  }

  /**
   * Find appointments by patient ID
   */
  async findByPatientId(patientId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(this.selectFields)
        .eq('patient_id', patientId)
        .order('date', { ascending: false })

      if (error) {
        logError('Error fetching appointments by patient ID', error, { patientId })
        throw error
      }

      return (data || []).map((row) => this.mapToEntity(row))
    } catch (error) {
      logError('Failed to get appointments by patient ID', error, { patientId })
      throw error
    }
  }
}

export const appointmentRepository = new AppointmentRepository()
