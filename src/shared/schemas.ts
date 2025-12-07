import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const UserRoleEnum = z.enum(['admin', 'doctor', 'reception', 'insurance', 'patient']);
export const GenderEnum = z.enum(['male', 'female']);
export const AppointmentStatusEnum = z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']);
export const RecordTypeEnum = z.enum(['visit', 'diagnosis', 'prescription', 'lab_result', 'imaging', 'surgery', 'vaccination', 'note', 'referral']);
export const SeverityEnum = z.enum(['mild', 'moderate', 'severe', 'critical']);
export const DiagnosisStatusEnum = z.enum(['active', 'resolved', 'chronic']);

// ==========================================
// Patient Schemas
// ==========================================

export const PatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  name_en: z.string().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  gender: GenderEnum,
  national_id: z.string().min(10, 'National ID must be at least 10 characters'),
  nationality: z.string().optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
});

export const CreatePatientSchema = PatientSchema;
export const UpdatePatientSchema = PatientSchema.partial();

// ==========================================
// Medical Record Schemas
// ==========================================

export const CreateMedicalRecordSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid().optional(), // Made optional as it's often inferred
  record_type: RecordTypeEnum,
  chief_complaint: z.string().optional(),
  history_of_present_illness: z.string().optional(),
  physical_examination: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateDiagnosisSchema = z.object({
  patient_id: z.string().uuid(),
  medical_record_id: z.string().uuid().optional(),
  doctor_id: z.string().uuid(),
  diagnosis_code: z.string().optional(),
  diagnosis_name: z.string().min(2, 'Diagnosis name is required'),
  severity: SeverityEnum.optional(),
  status: DiagnosisStatusEnum.default('active'),
  notes: z.string().optional(),
});

export const CreatePrescriptionSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  medical_record_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    medication_name: z.string().min(2),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string().optional(),
  })).min(1, 'At least one medication is required'),
});

export const CreateVitalSignsSchema = z.object({
  patient_id: z.string().uuid(),
  temperature: z.number().min(30).max(45).optional(),
  blood_pressure_systolic: z.number().min(50).max(250).optional(),
  blood_pressure_diastolic: z.number().min(30).max(150).optional(),
  heart_rate: z.number().min(30).max(250).optional(),
  respiratory_rate: z.number().min(10).max(60).optional(),
  oxygen_saturation: z.number().min(50).max(100).optional(),
  weight: z.number().min(1).max(500).optional(),
  height: z.number().min(30).max(300).optional(),
  bmi: z.number().optional(),
  notes: z.string().optional(),
});

// ==========================================
// Appointment Schemas
// ==========================================

export const CreateAppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  date: z.string().datetime(), // ISO 8601
  duration: z.number().default(30),
  specialist: z.string().optional(), // Legacy field support
  notes: z.string().optional(),
});

export const UpdateAppointmentStatusSchema = z.object({
  status: AppointmentStatusEnum,
  cancellation_reason: z.string().optional(),
});

// ==========================================
// Auth Schemas
// ==========================================

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: UserRoleEnum,
  phone: z.string().optional(),
});
