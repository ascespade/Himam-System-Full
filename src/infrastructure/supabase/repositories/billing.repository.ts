/**
 * Billing Repository
 * Manages billing data with BaseRepository pattern
 */

import { BaseRepository } from '@/core/repositories/base.repository'
import { supabaseAdmin } from '@/lib'
import { logError } from '@/shared/utils/logger'

export interface Billing extends Record<string, unknown> {
  id: string
  patient_id: string | null
  appointment_id: string | null
  amount: number
  status: string
  payment_method: string | null
  payment_date: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export class BillingRepository extends BaseRepository<Billing> {
  protected readonly tableName = 'billing'
  protected readonly selectFields = '*'

  /**
   * Map database row to entity
   */
  protected mapToEntity(row: unknown): Billing {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      patient_id: (data.patient_id as string | null) || null,
      appointment_id: (data.appointment_id as string | null) || null,
      amount: (data.amount as number) || 0,
      status: (data.status as string) || 'pending',
      payment_method: (data.payment_method as string | null) || null,
      payment_date: (data.payment_date as string | null) || null,
      notes: (data.notes as string | null) || null,
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string | null) || null,
    }
  }

  /**
   * Find billing by ID
   */
  async findById(id: string): Promise<Billing | null> {
    return this.getById(id)
  }

  /**
   * Find billing records by patient ID
   */
  async findByPatientId(patientId: string): Promise<Billing[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(this.selectFields)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        logError('Error fetching billing by patient ID', error, { patientId })
        throw error
      }

      return (data || []).map((row) => this.mapToEntity(row))
    } catch (error) {
      logError('Failed to get billing by patient ID', error, { patientId })
      throw error
    }
  }
}

export const billingRepository = new BillingRepository()
