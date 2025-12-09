# Guardian Module - Complete Documentation

## Overview

The Guardian Module enables guardians (parents, legal guardians, etc.) to access patient information and manage approvals based on configurable permissions.

## Features

### 1. Guardian-Patient Relationships
- Link multiple guardians to a patient
- Define relationship type (parent, guardian, spouse, sibling, other)
- Set primary guardian
- Configure granular permissions

### 2. Permission System
- `view_records`: Access to patient medical records
- `view_appointments`: Access to appointment information
- `approve_procedures`: Ability to approve medical procedures
- `view_billing`: Access to billing information

### 3. APIs

#### GET `/api/guardian/patients`
List all patients linked to the authenticated guardian.

#### GET `/api/guardian/patients/[id]`
Get patient details (filtered by permissions).

#### GET `/api/guardian/patients/[id]/records`
Get patient records (limited by permissions).

#### POST `/api/guardian/approve-procedure`
Approve or reject a procedure requiring guardian consent.

#### GET `/api/guardian/notifications`
Get notifications for the guardian.

### 4. WhatsApp Integration
- Automatic notifications for appointments
- Session completion alerts
- Approval requests
- Status updates

## Database Schema

### `guardian_patient_relationships`
```sql
- id: UUID
- guardian_id: UUID (references users)
- patient_id: UUID (references patients)
- relationship_type: VARCHAR (parent, guardian, spouse, sibling, other)
- is_primary: BOOLEAN
- permissions: JSONB
- is_active: BOOLEAN
```

## Usage Examples

### Link Guardian to Patient
```typescript
await guardianRepository.linkGuardian({
  guardian_id: 'user-id',
  patient_id: 'patient-id',
  relationship_type: 'parent',
  is_primary: true,
  permissions: {
    view_records: true,
    view_appointments: true,
    approve_procedures: true,
    view_billing: false
  }
})
```

### Get Patient Guardians
```typescript
const guardians = await guardianRepository.getPatientGuardians(patientId)
```

### Update Permissions
```typescript
await guardianRepository.updatePermissions(relationshipId, {
  approve_procedures: true
})
```

## Security

- Guardians can only access patients they're linked to
- Data filtering based on permissions
- RLS policies enforce access control
- API authentication required

## Frontend Pages

- `/dashboard/guardian` - Dashboard
- `/dashboard/guardian/patients` - Patient list
- `/dashboard/guardian/patients/[id]` - Patient details
- `/dashboard/guardian/approvals` - Pending approvals
