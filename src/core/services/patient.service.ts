/**
 * Patient Service
 * Business logic for patient management
 */

import { BaseService, ServiceException } from './base.service'
import { createPatientSchema, updatePatientSchema, type CreatePatientInput, type UpdatePatientInput } from '@/core/validations/schemas'
import type { Patient } from '@/shared/types'

export class PatientService extends BaseService {
  /**
   * Creates a new patient
   */
  async createPatient(input: CreatePatientInput): Promise<Patient> {
    const validated = createPatientSchema.parse(input)

    // Check if patient with same phone exists
    const { data: existing } = await this.supabase
      .from('patients')
      .select('id')
      .eq('phone', validated.phone)
      .single()

    if (existing) {
      throw new ServiceException('Patient with this phone number already exists', 'PATIENT_EXISTS')
    }

    // Create patient
    const { data: patient, error } = await this.supabase
      .from('patients')
      .insert({
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        date_of_birth: validated.date_of_birth,
        gender: validated.gender,
        address: validated.address,
        emergency_contact: validated.emergency_contact,
        emergency_phone: validated.emergency_phone,
        medical_history: validated.medical_history,
        allergies: validated.allergies,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw this.handleError(error, 'createPatient')
    }

    return this.requireData(patient, 'Failed to create patient')
  }

  /**
   * Updates a patient
   */
  async updatePatient(patientId: string, input: UpdatePatientInput): Promise<Patient> {
    const validated = updatePatientSchema.parse(input)

    // Check phone uniqueness if phone is being updated
    if (validated.phone) {
      const { data: existing } = await this.supabase
        .from('patients')
        .select('id')
        .eq('phone', validated.phone)
        .neq('id', patientId)
        .single()

      if (existing) {
        throw new ServiceException('Patient with this phone number already exists', 'PATIENT_EXISTS')
      }
    }

    const { data: patient, error } = await this.supabase
      .from('patients')
      .update(validated)
      .eq('id', patientId)
      .select()
      .single()

    if (error) {
      throw this.handleError(error, 'updatePatient')
    }

    return this.requireData(patient, 'Patient not found')
  }

  /**
   * Finds a patient by ID
   */
  async findById(patientId: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw this.handleError(error, 'findById')
    }

    return data
  }

  /**
   * Finds a patient by phone
   */
  async findByPhone(phone: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw this.handleError(error, 'findByPhone')
    }

    return data
  }

  /**
   * Searches patients by name, phone, or email
   */
  async search(query: string, page = 1, limit = 50): Promise<{ data: Patient[]; total: number }> {
    const offset = (page - 1) * limit

    const { data, error, count } = await this.supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw this.handleError(error, 'search')
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }
}

// Export singleton instance
export const patientService = new PatientService()
