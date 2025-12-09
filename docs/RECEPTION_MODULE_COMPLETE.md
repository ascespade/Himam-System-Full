# Reception Module - Complete Documentation

## Overview

The Reception Module is the central hub for patient management, queue coordination, and workflow management between reception and doctors.

## Features

### 1. Patient Management
- Complete patient registration with all medical fields
- Patient search and filtering
- Medical history tracking
- Guardian relationship management

### 2. Queue Management
- Real-time queue tracking
- Priority-based queuing
- Status management (waiting, in_progress, confirmed, completed, cancelled)
- Assignment to doctors

### 3. Payment & Insurance Verification
- Payment status checking
- Insurance approval workflow
- Business rules integration
- First visit detection (free consultation)

### 4. Patient Visits
- Links reception workflow to doctor sessions
- Visit tracking
- Payment and insurance status
- Notes and documentation

## APIs

### Patients
- `GET /api/reception/patients` - List patients
- `POST /api/reception/patients` - Register new patient
- `GET /api/reception/patients/[id]` - Get patient details
- `GET /api/reception/patients/[id]/guardians` - Get patient guardians
- `GET /api/reception/patients/[id]/medical-history` - Get medical history

### Queue
- `GET /api/reception/queue` - Get queue items
- `POST /api/reception/queue` - Add to queue
- `POST /api/reception/queue/[id]/confirm-to-doctor` - Confirm to doctor

## Business Rules

### Payment Verification
- First visit consultation is free
- Payment or insurance approval required for subsequent visits
- Business rules engine evaluates conditions

### Session Validation
- AI-powered validation
- Template-based checking
- Missing field detection
- Warning system

## Database Schema

### `reception_queue`
- Queue management with priorities
- Status tracking
- Doctor assignment

### `patient_visits`
- Links queue to sessions
- Payment/insurance status
- Visit documentation

### `patient_insurance`
- Insurance provider information
- Verification status
- Coverage details

## Workflow

1. Patient arrives → Added to queue
2. Payment/insurance verification
3. Confirmed to doctor
4. Patient visit created
5. Doctor session starts
6. Session completion
7. Billing and documentation

## Frontend Pages

- `/dashboard/reception` - Dashboard
- `/dashboard/reception/patients` - Patient list
- `/dashboard/reception/patients/new` - New patient registration
- `/dashboard/reception/patients/[id]` - Patient profile
- `/dashboard/reception/queue` - Queue management
