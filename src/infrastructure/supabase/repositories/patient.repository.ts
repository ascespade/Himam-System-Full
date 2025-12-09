/**
 * Patient Repository Implementation
 * Supabase-based implementation of patient data access operations
 */

import { supabaseAdmin } from '@/lib'
import type {
  IPatientRepository,
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  PatientSearchFilters,
} from '@/core/interfaces/repositories/patient.repository.interface'
import { DatabaseError } from '@/core/errors'

export class PatientRepository implements IPatientRepository {
  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch patient', { error, id })
    }

    return this.mapToEntity(data)
  }

  async findByPhone(phone: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch patient by phone', { error, phone })
    }

    return this.mapToEntity(data)
  }

  async findByNationalId(nationalId: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('national_id', nationalId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch patient by national ID', { error, nationalId })
    }

    return this.mapToEntity(data)
  }

  async findByEmail(email: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch patient by email', { error, email })
    }

    return this.mapToEntity(data)
  }

  async search(filters: PatientSearchFilters): Promise<{ patients: Patient[]; total: number }> {
    let query = supabaseAdmin.from('patients').select('*', { count: 'exact' })

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,national_id.ilike.%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.gender) {
      query = query.eq('gender', filters.gender)
    }

    query = query.order('created_at', { ascending: false })

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw new DatabaseError('Failed to search patients', { error, filters })
    }

    return {
      patients: (data || []).map((row) => this.mapToEntity(row)),
      total: count || 0,
    }
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert({
        name: input.name,
        phone: input.phone,
        email: input.email,
        date_of_birth: input.date_of_birth,
        gender: input.gender,
        national_id: input.national_id,
        nationality: input.nationality,
        address: input.address,
        blood_type: input.blood_type,
        allergies: input.allergies || [],
        chronic_diseases: input.chronic_diseases || [],
        emergency_contact_name: input.emergency_contact_name,
        emergency_contact_phone: input.emergency_contact_phone,
        emergency_contact_relation: input.emergency_contact_relation,
        notes: input.notes,
        status: input.status || 'active',
      })
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create patient', { error, input })
    }

    return this.mapToEntity(data)
  }

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

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to update patient', { error, id, input })
    }

    return this.mapToEntity(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete patient', { error, id })
    }
  }

  async getMedicalHistory(patientId: string): Promise<unknown[]> {
    // Get comprehensive medical history including sessions, appointments, records, etc.
    const [sessions, appointments, records] = await Promise.all([
      supabaseAdmin.from('sessions').select('*').eq('patient_id', patientId).order('date', { ascending: false }),
      supabaseAdmin.from('appointments').select('*').eq('patient_id', patientId).order('date', { ascending: false }),
      supabaseAdmin.from('medical_records').select('*').eq('patient_id', patientId).order('date', { ascending: false }),
    ])

    return [
      ...(sessions.data || []).map((s) => ({ type: 'session', ...s })),
      ...(appointments.data || []).map((a) => ({ type: 'appointment', ...a })),
      ...(records.data || []).map((r) => ({ type: 'record', ...r })),
    ]
  }

  private mapToEntity(row: unknown): Patient {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      name: data.name as string,
      phone: (data.phone as string | null) || null,
      email: (data.email as string | null) || null,
      date_of_birth: (data.date_of_birth as string | null) || null,
      gender: (data.gender as 'male' | 'female' | 'other' | null) || null,
      national_id: (data.national_id as string | null) || null,
      nationality: (data.nationality as string | null) || null,
      address: (data.address as string | null) || null,
      blood_type: (data.blood_type as Patient['blood_type']) || null,
      allergies: (data.allergies as string[]) || [],
      chronic_diseases: (data.chronic_diseases as string[]) || [],
      emergency_contact_name: (data.emergency_contact_name as string | null) || null,
      emergency_contact_phone: (data.emergency_contact_phone as string | null) || null,
      emergency_contact_relation: (data.emergency_contact_relation as string | null) || null,
      status: (data.status as string) || 'active',
      notes: (data.notes as string | null) || null,
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string | null) || null,
    }
  }
}

export const patientRepository = new PatientRepository()

