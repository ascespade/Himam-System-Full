# Supervisor Module - Complete Documentation

## Overview

The Supervisor Module provides medical supervisors with tools to monitor quality, review sessions, and manage critical cases.

## Features

### 1. Dashboard
- Comprehensive statistics
- Quality metrics overview
- Review rates
- Critical case counts

### 2. Session Reviews
- Review sessions for quality and compliance
- Add findings and recommendations
- Track review status
- Priority-based review queue

### 3. Quality Metrics
- Track doctor performance
- Quality scores
- Compliance scores
- Correction requirements

### 4. Critical Cases
- Detect and manage critical cases
- Severity levels (low, medium, high, critical)
- Case types (medical_emergency, risk_detection, compliance_issue, quality_concern)
- Resolution tracking

## APIs

### GET `/api/supervisor/dashboard`
Get comprehensive dashboard statistics.

### GET `/api/supervisor/critical-cases`
Get critical cases with filters.

### POST `/api/supervisor/critical-cases`
Create a new critical case.

### GET `/api/supervisor/reviews`
Get session reviews.

### POST `/api/supervisor/reviews`
Create a new review.

### GET `/api/supervisor/quality`
Get quality metrics and analytics.

## Database Schema

### `supervisor_reviews`
```sql
- id: UUID
- supervisor_id: UUID
- session_id: UUID
- patient_id: UUID
- doctor_id: UUID
- review_type: VARCHAR (quality, compliance, critical_case, routine)
- status: VARCHAR (pending, in_review, approved, needs_correction, rejected)
- findings: TEXT
- recommendations: TEXT
- priority: VARCHAR (low, normal, high, critical)
```

### `supervisor_quality_metrics`
```sql
- id: UUID
- doctor_id: UUID
- metric_date: DATE
- total_sessions: INTEGER
- reviewed_sessions: INTEGER
- quality_score: NUMERIC(5,2)
- compliance_score: NUMERIC(5,2)
- critical_cases_count: INTEGER
- corrections_required: INTEGER
```

### `critical_cases`
```sql
- id: UUID
- patient_id: UUID
- session_id: UUID
- doctor_id: UUID
- case_type: VARCHAR
- severity: VARCHAR
- description: TEXT
- detected_by: VARCHAR (ai, doctor, supervisor, system)
- status: VARCHAR (open, in_review, resolved, escalated)
```

## Usage Examples

### Create Review
```typescript
await supabaseAdmin.from('supervisor_reviews').insert({
  supervisor_id: supervisorId,
  session_id: sessionId,
  review_type: 'quality',
  findings: 'Session documentation is complete',
  recommendations: 'Continue current practices',
  priority: 'normal'
})
```

### Create Critical Case
```typescript
await supabaseAdmin.from('critical_cases').insert({
  patient_id: patientId,
  case_type: 'risk_detection',
  severity: 'high',
  description: 'Patient shows signs of risk',
  detected_by: 'ai',
  status: 'open'
})
```

## Frontend Pages

- `/dashboard/supervisor` - Dashboard
- `/dashboard/supervisor/critical-cases` - Critical cases
- `/dashboard/supervisor/reviews` - Session reviews
- `/dashboard/supervisor/quality` - Quality analytics
