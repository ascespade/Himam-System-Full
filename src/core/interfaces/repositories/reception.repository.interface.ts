/**
 * Reception Repository Interface
 * Defines contract for reception workflow operations
 */

export interface ReceptionQueueItem {
  id: string
  patient_id: string
  queue_number: number
  status: 'waiting' | 'in_progress' | 'confirmed' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  service_type: string | null
  notes: string | null
  assigned_to: string | null
  confirmed_to_doctor_at: string | null
  created_at: string
  updated_at: string | null
}

export interface PatientVisit {
  id: string
  patient_id: string
  queue_id: string | null
  session_id: string | null
  visit_date: string
  visit_type: 'consultation' | 'follow_up' | 'emergency' | 'routine'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  reception_notes: string | null
  doctor_notes: string | null
  payment_status: 'pending' | 'verified' | 'paid' | 'waived'
  insurance_status: 'pending' | 'approved' | 'rejected' | 'not_applicable'
  created_by: string | null
  created_at: string
  updated_at: string | null
}

export interface PatientInsurance {
  id: string
  patient_id: string
  provider: string
  policy_number: string
  policy_holder_name: string | null
  coverage_type: string | null
  coverage_start_date: string | null
  coverage_end_date: string | null
  is_active: boolean
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired'
  verification_notes: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string | null
}

export interface CreateQueueItemInput {
  patient_id: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  service_type?: string
  notes?: string
  assigned_to?: string
}

export interface CreateVisitInput {
  patient_id: string
  queue_id?: string
  visit_date: string
  visit_type?: 'consultation' | 'follow_up' | 'emergency' | 'routine'
  reception_notes?: string
  created_by?: string
}

export interface CreateInsuranceInput {
  patient_id: string
  provider: string
  policy_number: string
  policy_holder_name?: string
  coverage_type?: string
  coverage_start_date?: string
  coverage_end_date?: string
}

export interface IReceptionRepository {
  // Queue operations
  addToQueue(input: CreateQueueItemInput): Promise<ReceptionQueueItem>
  getQueueItem(queueId: string): Promise<ReceptionQueueItem | null>
  getQueueItems(filters?: { status?: string; assigned_to?: string }): Promise<ReceptionQueueItem[]>
  updateQueueItem(queueId: string, updates: Partial<ReceptionQueueItem>): Promise<ReceptionQueueItem>
  confirmToDoctor(queueId: string, doctorId: string): Promise<ReceptionQueueItem>
  
  // Visit operations
  createVisit(input: CreateVisitInput): Promise<PatientVisit>
  getVisit(visitId: string): Promise<PatientVisit | null>
  getPatientVisits(patientId: string): Promise<PatientVisit[]>
  updateVisit(visitId: string, updates: Partial<PatientVisit>): Promise<PatientVisit>
  
  // Insurance operations
  createInsurance(input: CreateInsuranceInput): Promise<PatientInsurance>
  getPatientInsurance(patientId: string): Promise<PatientInsurance[]>
  updateInsurance(insuranceId: string, updates: Partial<PatientInsurance>): Promise<PatientInsurance>
  verifyInsurance(insuranceId: string, verifiedBy: string, status: 'verified' | 'rejected', notes?: string): Promise<PatientInsurance>
}
