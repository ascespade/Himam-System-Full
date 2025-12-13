/**
 * Patient Service
 * Business logic for patient management
 */

import { BaseService, ServiceException } from './base.service'
import { supabaseAdmin } from '@/lib'
import { logError } from '@/shared/utils/logger'
import { createPatientSchema, updatePatientSchema, type CreatePatientInput, type UpdatePatientInput } from '@/core/validations/schemas'
import type { Patient } from '@/shared/types'

export class PatientService extends BaseService {
  /**
   * Creates a new patient
   */
  async createPatient(input: CreatePatientInput): Promise<Patient> {
    const validated = createPatientSchema.parse(input)

    // Check if patient with same phone exists
    const { data: existing } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('phone', validated.phone)
      .single()

    if (existing) {
      throw new ServiceException('Patient with this phone number already exists', 'PATIENT_EXISTS')
    }

    // Create patient
    const { data: patient, error } = await supabaseAdmin
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
      .select('id, name, email, phone, date_of_birth, gender, address, emergency_contact, emergency_phone, medical_history, allergies, created_at, updated_at')
      .single()

    if (error) {
      logError('Error creating patient', error, { input: validated })
      throw new ServiceException('Failed to create patient', 'PATIENT_CREATE_ERROR')
    }

    if (!patient) {
      throw new ServiceException('Failed to create patient', 'PATIENT_CREATE_ERROR')
    }

    return patient as Patient
  }

  /**
   * Updates a patient
   */
  async updatePatient(patientId: string, input: UpdatePatientInput): Promise<Patient> {
    const validated = updatePatientSchema.parse(input)

    // Check phone uniqueness if phone is being updated
    if (validated.phone) {
      const { data: existing } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('phone', validated.phone)
        .neq('id', patientId)
        .single()

      if (existing) {
        throw new ServiceException('Patient with this phone number already exists', 'PATIENT_EXISTS')
      }
    }

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update(validated)
      .eq('id', patientId)
      .select('id, name, email, phone, date_of_birth, gender, address, emergency_contact, emergency_phone, medical_history, allergies, created_at, updated_at')
      .single()

    if (error) {
      logError('Error updating patient', error, { patientId, input: validated })
      throw new ServiceException('Failed to update patient', 'PATIENT_UPDATE_ERROR')
    }

    if (!patient) {
      throw new ServiceException('Patient not found', 'NOT_FOUND')
    }

    return patient as Patient
  }

  /**
   * Finds a patient by ID
   */
  async findById(patientId: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('id, name, email, phone, date_of_birth, gender, address, emergency_contact, emergency_phone, medical_history, allergies, created_at, updated_at')
      .eq('id', patientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      logError('Error finding patient by ID', error, { patientId })
      throw new ServiceException('Failed to find patient', 'PATIENT_FETCH_ERROR')
    }

    return data
  }

  /**
   * Finds a patient by phone
   */
  async findByPhone(phone: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('id, name, email, phone, date_of_birth, gender, address, emergency_contact, emergency_phone, medical_history, allergies, created_at, updated_at')
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      logError('Error finding patient by phone', error, { phone })
      throw new ServiceException('Failed to find patient', 'PATIENT_FETCH_ERROR')
    }

    return data
  }

  /**
   * Searches patients by name, phone, or email
   */
  async search(query: string, page = 1, limit = 50): Promise<{ data: Patient[]; total: number }> {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('patients')
      .select('id, name, email, phone, date_of_birth, gender, address, emergency_contact, emergency_phone, medical_history, allergies, created_at, updated_at', { count: 'exact' })
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logError('Error searching patients', error, { query, page, limit })
      throw new ServiceException('Failed to search patients', 'PATIENT_SEARCH_ERROR')
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }
}

// Export singleton instance
export const patientService = new PatientService()
