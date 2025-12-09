/**
 * Patient Repository Interface
 * Contract for patient data access operations
 */

export interface Patient {
  id: string
  name: string
  phone: string | null
  email: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  national_id: string | null
  nationality: string | null
  address: string | null
  blood_type: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null
  allergies: string[]
  chronic_diseases: string[]
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface CreatePatientInput {
  name: string
  phone?: string | null
  email?: string | null
  date_of_birth?: string | null
  gender?: 'male' | 'female' | 'other' | null
  national_id?: string | null
  nationality?: string | null
  address?: string | null
  blood_type?: Patient['blood_type']
  allergies?: string[]
  chronic_diseases?: string[]
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relation?: string | null
  notes?: string | null
  status?: string
}

export interface UpdatePatientInput {
  name?: string
  phone?: string | null
  email?: string | null
  date_of_birth?: string | null
  gender?: 'male' | 'female' | 'other' | null
  national_id?: string | null
  nationality?: string | null
  address?: string | null
  blood_type?: Patient['blood_type']
  allergies?: string[]
  chronic_diseases?: string[]
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relation?: string | null
  notes?: string | null
  status?: string
}

export interface PatientSearchFilters {
  search?: string
  status?: string
  gender?: 'male' | 'female' | 'other'
  limit?: number
  offset?: number
}

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>
  findByPhone(phone: string): Promise<Patient | null>
  findByNationalId(nationalId: string): Promise<Patient | null>
  findByEmail(email: string): Promise<Patient | null>
  search(filters: PatientSearchFilters): Promise<{ patients: Patient[]; total: number }>
  create(input: CreatePatientInput): Promise<Patient>
  update(id: string, input: UpdatePatientInput): Promise<Patient>
  delete(id: string): Promise<void>
  getMedicalHistory(patientId: string): Promise<unknown[]>
}
