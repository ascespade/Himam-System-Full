/**
 * Guardian Repository Interface
 * Contract for guardian-patient relationship operations
 */

export type RelationshipType = 'parent' | 'guardian' | 'spouse' | 'sibling' | 'other'

export interface GuardianRelationship {
  id: string
  guardian_id: string
  patient_id: string
  relationship_type: RelationshipType
  is_primary: boolean
  permissions: {
    view_records: boolean
    view_appointments: boolean
    approve_procedures: boolean
    view_billing: boolean
  }
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface CreateGuardianRelationshipInput {
  guardian_id: string
  patient_id: string
  relationship_type: RelationshipType
  is_primary?: boolean
  permissions?: Partial<GuardianRelationship['permissions']>
}

export interface UpdateGuardianRelationshipInput {
  relationship_type?: RelationshipType
  is_primary?: boolean
  is_active?: boolean
  permissions?: Partial<GuardianRelationship['permissions']>
}

export interface IGuardianRepository {
  linkGuardian(input: CreateGuardianRelationshipInput): Promise<GuardianRelationship>
  getPatientGuardians(patientId: string): Promise<GuardianRelationship[]>
  getGuardianPatients(guardianId: string): Promise<GuardianRelationship[]>
  updatePermissions(relationshipId: string, permissions: Partial<GuardianRelationship['permissions']>): Promise<GuardianRelationship>
  updateRelationship(relationshipId: string, input: UpdateGuardianRelationshipInput): Promise<GuardianRelationship>
  removeRelationship(relationshipId: string): Promise<void>
  getRelationship(relationshipId: string): Promise<GuardianRelationship | null>
}
