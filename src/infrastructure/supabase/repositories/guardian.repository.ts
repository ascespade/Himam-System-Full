/**
 * Guardian Repository Implementation
 * Supabase-based implementation of guardian-patient relationship operations
 */

import { supabaseAdmin } from '@/lib'
import type {
  IGuardianRepository,
  GuardianRelationship,
  CreateGuardianRelationshipInput,
  UpdateGuardianRelationshipInput
} from '@/core/interfaces/repositories/guardian.repository.interface'

export class GuardianRepository implements IGuardianRepository {
  private readonly table = 'guardian_patient_relationships'

  /**
   * Link guardian to patient
   */
  async linkGuardian(input: CreateGuardianRelationshipInput): Promise<GuardianRelationship> {
    const relationshipData = {
      guardian_id: input.guardian_id,
      patient_id: input.patient_id,
      relationship_type: input.relationship_type,
      is_primary: input.is_primary || false,
      permissions: {
        view_records: input.permissions?.view_records ?? true,
        view_appointments: input.permissions?.view_appointments ?? true,
        approve_procedures: input.permissions?.approve_procedures ?? false,
        view_billing: input.permissions?.view_billing ?? false,
        ...input.permissions
      },
      is_active: true,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert(relationshipData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to link guardian: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Get all guardians for a patient
   */
  async getPatientGuardians(patientId: string): Promise<GuardianRelationship[]> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch patient guardians: ${error.message}`)
    }

    return (data || []).map(row => this.mapToEntity(row))
  }

  /**
   * Get all patients for a guardian
   */
  async getGuardianPatients(guardianId: string): Promise<GuardianRelationship[]> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('guardian_id', guardianId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch guardian patients: ${error.message}`)
    }

    return (data || []).map(row => this.mapToEntity(row))
  }

  /**
   * Update permissions for a relationship
   */
  async updatePermissions(
    relationshipId: string,
    permissions: Partial<GuardianRelationship['permissions']>
  ): Promise<GuardianRelationship> {
    // Get current relationship
    const current = await this.getRelationship(relationshipId)
    if (!current) {
      throw new Error('Relationship not found')
    }

    // Merge permissions
    const updatedPermissions = {
      ...current.permissions,
      ...permissions
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update({ permissions: updatedPermissions })
      .eq('id', relationshipId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update permissions: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Update relationship
   */
  async updateRelationship(
    relationshipId: string,
    input: UpdateGuardianRelationshipInput
  ): Promise<GuardianRelationship> {
    const updateData: Record<string, unknown> = {}

    if (input.relationship_type !== undefined) {
      updateData.relationship_type = input.relationship_type
    }
    if (input.is_primary !== undefined) {
      updateData.is_primary = input.is_primary
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active
    }
    if (input.permissions !== undefined) {
      // Get current permissions and merge
      const current = await this.getRelationship(relationshipId)
      if (current) {
        updateData.permissions = {
          ...current.permissions,
          ...input.permissions
        }
      } else {
        updateData.permissions = input.permissions
      }
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update(updateData)
      .eq('id', relationshipId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update relationship: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Remove relationship (soft delete by setting is_active to false)
   */
  async removeRelationship(relationshipId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.table)
      .update({ is_active: false })
      .eq('id', relationshipId)

    if (error) {
      throw new Error(`Failed to remove relationship: ${error.message}`)
    }
  }

  /**
   * Get relationship by ID
   */
  async getRelationship(relationshipId: string): Promise<GuardianRelationship | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('id', relationshipId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch relationship: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  /**
   * Map database row to GuardianRelationship entity
   */
  private mapToEntity(row: unknown): GuardianRelationship {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      guardian_id: data.guardian_id as string,
      patient_id: data.patient_id as string,
      relationship_type: data.relationship_type as GuardianRelationship['relationship_type'],
      is_primary: (data.is_primary as boolean) || false,
      permissions: (data.permissions as GuardianRelationship['permissions']) || {
        view_records: true,
        view_appointments: true,
        approve_procedures: false,
        view_billing: false
      },
      is_active: (data.is_active as boolean) !== false,
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string) || null
    }
  }
}

export const guardianRepository = new GuardianRepository()
