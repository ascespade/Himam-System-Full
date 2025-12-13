/**
 * Patient Service
 * Business logic for patient management
 */

import { BaseService, ServiceException } from './base.service'
import { logError } from '@/shared/utils/logger'
import { createPatientSchema, updatePatientSchema, type CreatePatientInput, type UpdatePatientInput } from '@/core/validations/schemas'
import type { Patient } from '@/shared/types'
import { patientRepository } from '@/infrastructure/supabase/repositories/patient.repository'
import type { CreatePatientInput as RepoCreateInput } from '@/core/interfaces/repositories/patient.repository.interface'

export class PatientService extends BaseService {
  /**
   * Creates a new patient
   */
  async createPatient(input: CreatePatientInput): Promise<Patient> {
    const validated = createPatientSchema.parse(input)

    // Check if patient with same phone exists
    const existing = await patientRepository.findByPhone(validated.phone || '')

    if (existing) {
      throw new ServiceException('Patient with this phone number already exists', 'PATIENT_EXISTS')
    }

    try {
      // Map service input to repository input
      const repoInput: RepoCreateInput = {
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone || null,
        date_of_birth: validated.date_of_birth || null,
        gender: validated.gender || null,
        address: validated.address || null,
        emergency_contact_name: validated.emergency_contact || null,
        emergency_contact_phone: validated.emergency_phone || null,
        allergies: validated.allergies || [],
        notes: validated.medical_history || null,
        status: 'active',
      }

      const repoPatient = await patientRepository.create(repoInput)

      // Map repository patient to service patient type
      return {
        id: repoPatient.id,
        name: repoPatient.name,
        email: repoPatient.email || '',
        phone: repoPatient.phone || '',
        dateOfBirth: repoPatient.date_of_birth || undefined,
        nationality: repoPatient.nationality || undefined,
        createdAt: repoPatient.created_at,
        updatedAt: repoPatient.updated_at || undefined,
      } as Patient
    } catch (error) {
      logError('Error creating patient', error, { input: validated })
      throw new ServiceException('Failed to create patient', 'PATIENT_CREATE_ERROR')
    }
  }

  /**
   * Updates a patient
   */
  async updatePatient(patientId: string, input: UpdatePatientInput): Promise<Patient> {
    const validated = updatePatientSchema.parse(input)

    // Check phone uniqueness if phone is being updated
    if (validated.phone) {
      const existing = await patientRepository.findByPhone(validated.phone)
      if (existing && existing.id !== patientId) {
        throw new ServiceException('Patient with this phone number already exists', 'PATIENT_EXISTS')
      }
    }

    try {
      // Map service input to repository input
      const repoInput: Partial<RepoCreateInput> = {}
      if (validated.name !== undefined) repoInput.name = validated.name
      if (validated.email !== undefined) repoInput.email = validated.email || null
      if (validated.phone !== undefined) repoInput.phone = validated.phone || null
      if (validated.date_of_birth !== undefined) repoInput.date_of_birth = validated.date_of_birth || null
      if (validated.gender !== undefined) repoInput.gender = validated.gender || null
      if (validated.address !== undefined) repoInput.address = validated.address || null
      if (validated.emergency_contact !== undefined) repoInput.emergency_contact_name = validated.emergency_contact || null
      if (validated.emergency_phone !== undefined) repoInput.emergency_contact_phone = validated.emergency_phone || null
      if (validated.allergies !== undefined) repoInput.allergies = validated.allergies || []
      if (validated.medical_history !== undefined) repoInput.notes = validated.medical_history || null

      const repoPatient = await patientRepository.update(patientId, repoInput)

      // Map repository patient to service patient type
      return {
        id: repoPatient.id,
        name: repoPatient.name,
        email: repoPatient.email || '',
        phone: repoPatient.phone || '',
        dateOfBirth: repoPatient.date_of_birth || undefined,
        nationality: repoPatient.nationality || undefined,
        createdAt: repoPatient.created_at,
        updatedAt: repoPatient.updated_at || undefined,
      } as Patient
    } catch (error) {
      logError('Error updating patient', error, { patientId, input: validated })
      throw new ServiceException('Failed to update patient', 'PATIENT_UPDATE_ERROR')
    }
  }

  /**
   * Finds a patient by ID
   */
  async findById(patientId: string): Promise<Patient | null> {
    try {
      const repoPatient = await patientRepository.findById(patientId)
      if (!repoPatient) return null

      // Map repository patient to service patient type
      return {
        id: repoPatient.id,
        name: repoPatient.name,
        email: repoPatient.email || '',
        phone: repoPatient.phone || '',
        dateOfBirth: repoPatient.date_of_birth || undefined,
        nationality: repoPatient.nationality || undefined,
        createdAt: repoPatient.created_at,
        updatedAt: repoPatient.updated_at || undefined,
      } as Patient
    } catch (error) {
      logError('Error finding patient by ID', error, { patientId })
      throw new ServiceException('Failed to find patient', 'PATIENT_FETCH_ERROR')
    }
  }

  /**
   * Finds a patient by phone
   */
  async findByPhone(phone: string): Promise<Patient | null> {
    try {
      const repoPatient = await patientRepository.findByPhone(phone)
      if (!repoPatient) return null

      // Map repository patient to service patient type
      return {
        id: repoPatient.id,
        name: repoPatient.name,
        email: repoPatient.email || '',
        phone: repoPatient.phone || '',
        dateOfBirth: repoPatient.date_of_birth || undefined,
        nationality: repoPatient.nationality || undefined,
        createdAt: repoPatient.created_at,
        updatedAt: repoPatient.updated_at || undefined,
      } as Patient
    } catch (error) {
      logError('Error finding patient by phone', error, { phone })
      throw new ServiceException('Failed to find patient', 'PATIENT_FETCH_ERROR')
    }
  }

  /**
   * Searches patients by name, phone, or email
   */
  async search(query: string, page = 1, limit = 50): Promise<{ data: Patient[]; total: number }> {
    try {
      const offset = (page - 1) * limit
      const result = await patientRepository.search({
        search: query,
        limit,
        offset,
      })

      // Map repository patients to service patient type
      const patients: Patient[] = result.patients.map((repoPatient) => ({
        id: repoPatient.id,
        name: repoPatient.name,
        email: repoPatient.email || '',
        phone: repoPatient.phone || '',
        dateOfBirth: repoPatient.date_of_birth || undefined,
        nationality: repoPatient.nationality || undefined,
        createdAt: repoPatient.created_at,
        updatedAt: repoPatient.updated_at || undefined,
      } as Patient))

      return {
        data: patients,
        total: result.total,
      }
    } catch (error) {
      logError('Error searching patients', error, { query, page, limit })
      throw new ServiceException('Failed to search patients', 'PATIENT_SEARCH_ERROR')
    }
  }
}

// Export singleton instance
export const patientService = new PatientService()
