/**
 * Patient Repository Implementation
 * Supabase-based implementation of patient data access
 */

import { supabaseAdmin } from '@/lib'
import type {
  IPatientRepository,
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  PatientSearchFilters
} from '@/core/interfaces/repositories/patient.repository.interface'

export class PatientRepository implements IPatientRepository {
  private readonly table = 'patients'

  /**
   * Find patient by ID
   */
  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch patient: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Find patient by phone number
   */
  async findByPhone(phone: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch patient by phone: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Find patient by national ID
   */
  async findByNationalId(nationalId: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('national_id', nationalId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch patient by national ID: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Find patient by email
   */
  async findByEmail(email: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch patient by email: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Search patients with filters
   */
  async search(filters: PatientSearchFilters): Promise<{ patients: Patient[]; total: number }> {
    const {
      search,
      status,
      gender,
      limit = 50,
      offset = 0
    } = filters

    let query = supabaseAdmin
      .from(this.table)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,national_id.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (gender) {
      query = query.eq('gender', gender)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to search patients: ${error.message}`)
    }

    return {
      patients: (data || []).map(row => this.mapToEntity(row)),
      total: count || 0
    }
  }

  /**
   * Create new patient
   */
  async create(input: CreatePatientInput): Promise<Patient> {
    const patientData = {
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      date_of_birth: input.date_of_birth || null,
      gender: input.gender || null,
      national_id: input.national_id || null,
      nationality: input.nationality || null,
      address: input.address || null,
      blood_type: input.blood_type || null,
      allergies: input.allergies || [],
      chronic_diseases: input.chronic_diseases || [],
      emergency_contact_name: input.emergency_contact_name || null,
      emergency_contact_phone: input.emergency_contact_phone || null,
      emergency_contact_relation: input.emergency_contact_relation || null,
      notes: input.notes || null,
      status: input.status || 'active',
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert(patientData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create patient: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Update patient
   */
  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.email !== undefined) updateData.email = input.email
    if (input.date_of_birth !== undefined) updateData.date_of_birth = input.date_of_birth
    if (input.gender !== undefined) updateData.gender = input.gender
    if (input.national_id !== undefined) updateData.national_id = input.national_id
    if (input.nationality !== undefined) updateData.nationality = input.nationality
    if (input.address !== undefined) updateData.address = input.address
    if (input.blood_type !== undefined) updateData.blood_type = input.blood_type
    if (input.allergies !== undefined) updateData.allergies = input.allergies
    if (input.chronic_diseases !== undefined) updateData.chronic_diseases = input.chronic_diseases
    if (input.emergency_contact_name !== undefined) updateData.emergency_contact_name = input.emergency_contact_name
    if (input.emergency_contact_phone !== undefined) updateData.emergency_contact_phone = input.emergency_contact_phone
    if (input.emergency_contact_relation !== undefined) updateData.emergency_contact_relation = input.emergency_contact_relation
    if (input.notes !== undefined) updateData.notes = input.notes
    if (input.status !== undefined) updateData.status = input.status

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update patient: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Delete patient
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.table)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete patient: ${error.message}`)
    }
  }

  /**
   * Get medical history for a patient
   */
  async getMedicalHistory(patientId: string): Promise<unknown[]> {
    // Get sessions
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`)
    }

    // Get appointments
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('phone', (await this.findById(patientId))?.phone || '')
      .order('date', { ascending: false })

    if (appointmentsError) {
      throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`)
    }

    // Get patient visits
    const { data: visits, error: visitsError } = await supabaseAdmin
      .from('patient_visits')
      .select('*')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })

    if (visitsError) {
      throw new Error(`Failed to fetch visits: ${visitsError.message}`)
    }

    return [
      ...(sessions || []).map(s => ({ type: 'session', ...s })),
      ...(appointments || []).map(a => ({ type: 'appointment', ...a })),
      ...(visits || []).map(v => ({ type: 'visit', ...v }))
    ]
  }

  /**
   * Map database row to Patient entity
   */
  private mapToEntity(row: unknown): Patient {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      name: data.name as string,
      phone: (data.phone as string) || null,
      email: (data.email as string) || null,
      date_of_birth: (data.date_of_birth as string) || null,
      gender: (data.gender as Patient['gender']) || null,
      national_id: (data.national_id as string) || null,
      nationality: (data.nationality as string) || null,
      address: (data.address as string) || null,
      blood_type: (data.blood_type as Patient['blood_type']) || null,
      allergies: (data.allergies as string[]) || [],
      chronic_diseases: (data.chronic_diseases as string[]) || [],
      emergency_contact_name: (data.emergency_contact_name as string) || null,
      emergency_contact_phone: (data.emergency_contact_phone as string) || null,
      emergency_contact_relation: (data.emergency_contact_relation as string) || null,
      status: (data.status as string) || 'active',
      notes: (data.notes as string) || null,
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string) || null
    }
  }
}

export const patientRepository = new PatientRepository()
