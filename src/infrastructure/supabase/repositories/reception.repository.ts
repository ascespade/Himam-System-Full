/**
 * Reception Repository Implementation
 * Supabase-based implementation of reception workflow operations
 */

import { supabaseAdmin } from '@/lib'
import type {
  IReceptionRepository,
  ReceptionQueueItem,
  PatientVisit,
  PatientInsurance,
  CreateQueueItemInput,
  CreateVisitInput,
  CreateInsuranceInput
} from '@/core/interfaces/repositories/reception.repository.interface'

export class ReceptionRepository implements IReceptionRepository {
  private readonly queueTable = 'reception_queue'
  private readonly visitsTable = 'patient_visits'
  private readonly insuranceTable = 'patient_insurance'

  // ========== Queue Operations ==========

  /**
   * Add patient to queue
   */
  async addToQueue(input: CreateQueueItemInput): Promise<ReceptionQueueItem> {
    // Get next queue number
    const { data: lastItem } = await supabaseAdmin
      .from(this.queueTable)
      .select('queue_number')
      .order('queue_number', { ascending: false })
      .limit(1)
      .single()

    const nextQueueNumber = lastItem ? (lastItem.queue_number as number) + 1 : 1

    const queueData = {
      patient_id: input.patient_id,
      queue_number: nextQueueNumber,
      status: 'waiting' as const,
      priority: input.priority || 'normal',
      service_type: input.service_type || null,
      notes: input.notes || null,
      assigned_to: input.assigned_to || null,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from(this.queueTable)
      .insert(queueData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add to queue: ${error.message}`)
    }

    return this.mapQueueItem(data)
  }

  /**
   * Get queue item by ID
   */
  async getQueueItem(queueId: string): Promise<ReceptionQueueItem | null> {
    const { data, error } = await supabaseAdmin
      .from(this.queueTable)
      .select('*')
      .eq('id', queueId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch queue item: ${error.message}`)
    }

    return this.mapQueueItem(data)
  }

  /**
   * Get queue items with filters
   */
  async getQueueItems(filters?: { status?: string; assigned_to?: string }): Promise<ReceptionQueueItem[]> {
    let query = supabaseAdmin
      .from(this.queueTable)
      .select('*')
      .order('priority', { ascending: false })
      .order('queue_number', { ascending: true })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch queue items: ${error.message}`)
    }

    return (data || []).map(row => this.mapQueueItem(row))
  }

  /**
   * Update queue item
   */
  async updateQueueItem(queueId: string, updates: Partial<ReceptionQueueItem>): Promise<ReceptionQueueItem> {
    const { data, error } = await supabaseAdmin
      .from(this.queueTable)
      .update(updates)
      .eq('id', queueId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update queue item: ${error.message}`)
    }

    return this.mapQueueItem(data)
  }

  /**
   * Confirm queue item to doctor
   */
  async confirmToDoctor(queueId: string, doctorId: string): Promise<ReceptionQueueItem> {
    const { data, error } = await supabaseAdmin
      .from(this.queueTable)
      .update({
        status: 'confirmed',
        assigned_to: doctorId,
        confirmed_to_doctor_at: new Date().toISOString()
      })
      .eq('id', queueId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to confirm to doctor: ${error.message}`)
    }

    return this.mapQueueItem(data)
  }

  // ========== Visit Operations ==========

  /**
   * Create patient visit
   */
  async createVisit(input: CreateVisitInput): Promise<PatientVisit> {
    const visitData = {
      patient_id: input.patient_id,
      queue_id: input.queue_id || null,
      visit_date: input.visit_date,
      visit_type: input.visit_type || 'consultation',
      status: 'scheduled' as const,
      reception_notes: input.reception_notes || null,
      payment_status: 'pending' as const,
      insurance_status: 'pending' as const,
      created_by: input.created_by || null,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from(this.visitsTable)
      .insert(visitData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create visit: ${error.message}`)
    }

    return this.mapVisit(data)
  }

  /**
   * Get visit by ID
   */
  async getVisit(visitId: string): Promise<PatientVisit | null> {
    const { data, error } = await supabaseAdmin
      .from(this.visitsTable)
      .select('*')
      .eq('id', visitId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch visit: ${error.message}`)
    }

    return this.mapVisit(data)
  }

  /**
   * Get patient visits
   */
  async getPatientVisits(patientId: string): Promise<PatientVisit[]> {
    const { data, error } = await supabaseAdmin
      .from(this.visitsTable)
      .select('*')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch patient visits: ${error.message}`)
    }

    return (data || []).map(row => this.mapVisit(row))
  }

  /**
   * Update visit
   */
  async updateVisit(visitId: string, updates: Partial<PatientVisit>): Promise<PatientVisit> {
    const { data, error } = await supabaseAdmin
      .from(this.visitsTable)
      .update(updates)
      .eq('id', visitId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update visit: ${error.message}`)
    }

    return this.mapVisit(data)
  }

  // ========== Insurance Operations ==========

  /**
   * Create insurance record
   */
  async createInsurance(input: CreateInsuranceInput): Promise<PatientInsurance> {
    const insuranceData = {
      patient_id: input.patient_id,
      provider: input.provider,
      policy_number: input.policy_number,
      policy_holder_name: input.policy_holder_name || null,
      coverage_type: input.coverage_type || null,
      coverage_start_date: input.coverage_start_date || null,
      coverage_end_date: input.coverage_end_date || null,
      is_active: true,
      verification_status: 'pending' as const,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from(this.insuranceTable)
      .insert(insuranceData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create insurance: ${error.message}`)
    }

    return this.mapInsurance(data)
  }

  /**
   * Get patient insurance records
   */
  async getPatientInsurance(patientId: string): Promise<PatientInsurance[]> {
    const { data, error } = await supabaseAdmin
      .from(this.insuranceTable)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch patient insurance: ${error.message}`)
    }

    return (data || []).map(row => this.mapInsurance(row))
  }

  /**
   * Update insurance record
   */
  async updateInsurance(insuranceId: string, updates: Partial<PatientInsurance>): Promise<PatientInsurance> {
    const { data, error } = await supabaseAdmin
      .from(this.insuranceTable)
      .update(updates)
      .eq('id', insuranceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update insurance: ${error.message}`)
    }

    return this.mapInsurance(data)
  }

  /**
   * Verify insurance
   */
  async verifyInsurance(
    insuranceId: string,
    verifiedBy: string,
    status: 'verified' | 'rejected',
    notes?: string
  ): Promise<PatientInsurance> {
    const { data, error } = await supabaseAdmin
      .from(this.insuranceTable)
      .update({
        verification_status: status,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        verification_notes: notes || null
      })
      .eq('id', insuranceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to verify insurance: ${error.message}`)
    }

    return this.mapInsurance(data)
  }

  // ========== Mappers ==========

  private mapQueueItem(row: unknown): ReceptionQueueItem {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      patient_id: data.patient_id as string,
      queue_number: data.queue_number as number,
      status: data.status as ReceptionQueueItem['status'],
      priority: data.priority as ReceptionQueueItem['priority'],
      service_type: (data.service_type as string) || null,
      notes: (data.notes as string) || null,
      assigned_to: (data.assigned_to as string) || null,
      confirmed_to_doctor_at: (data.confirmed_to_doctor_at as string) || null,
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string) || null
    }
  }

  private mapVisit(row: unknown): PatientVisit {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      patient_id: data.patient_id as string,
      queue_id: (data.queue_id as string) || null,
      session_id: (data.session_id as string) || null,
      visit_date: data.visit_date as string,
      visit_type: data.visit_type as PatientVisit['visit_type'],
      status: data.status as PatientVisit['status'],
      reception_notes: (data.reception_notes as string) || null,
      doctor_notes: (data.doctor_notes as string) || null,
      payment_status: data.payment_status as PatientVisit['payment_status'],
      insurance_status: data.insurance_status as PatientVisit['insurance_status'],
      created_by: (data.created_by as string) || null,
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string) || null
    }
  }

  private mapInsurance(row: unknown): PatientInsurance {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      patient_id: data.patient_id as string,
      provider: data.provider as string,
      policy_number: data.policy_number as string,
      policy_holder_name: (data.policy_holder_name as string) || null,
      coverage_type: (data.coverage_type as string) || null,
      coverage_start_date: (data.coverage_start_date as string) || null,
      coverage_end_date: (data.coverage_end_date as string) || null,
      is_active: (data.is_active as boolean) !== false,
      verification_status: data.verification_status as PatientInsurance['verification_status'],
      verification_notes: (data.verification_notes as string) || null,
      verified_by: (data.verified_by as string) || null,
      verified_at: (data.verified_at as string) || null,
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string) || null
    }
  }
}

export const receptionRepository = new ReceptionRepository()
