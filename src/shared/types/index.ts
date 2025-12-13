/**
 * Centralized TypeScript Types and Interfaces
 * All shared types used across the application
 */

// Re-export error types
export * from './errors'

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// Domain Types
// ============================================================================

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'doctor' | 'patient' | 'staff' | 'reception' | 'guardian' | 'supervisor'
  created_at?: string
  updated_at?: string
}

export interface Specialist {
  id: string
  name: string
  specialty: string
  nationality: string
  email: string
  phone?: string
  bio?: string
  image?: string
  createdAt?: string
  updatedAt?: string
}

export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth?: string
  nationality?: string
  createdAt: string
  updatedAt?: string
}

export interface Appointment {
  id: string
  patientName: string
  phone: string
  specialist: string
  date: string
  status: AppointmentStatus
  calendarEventId?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Billing {
  id: string
  patientName: string
  amount: number
  paid: boolean
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface Signature {
  id: string
  patientName: string
  sessionId?: string
  signatureUrl: string
  documentType?: string
  createdAt: string
}

export interface Session {
  id: string
  patientId: string
  specialistId: string
  date: string
  notes?: string
  status: AppointmentStatus
  createdAt: string
  updatedAt?: string
}

export interface Service {
  id: string
  title: string
  description: string
  icon: string
  createdAt?: string
  updatedAt?: string
}

// ============================================================================
// Medical Types
// ============================================================================

export interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  date: string
  recordType: 'visit' | 'diagnosis' | 'prescription' | 'lab_result' | 'imaging' | 'surgery' | 'vaccination' | 'note' | 'referral'
  chiefComplaint?: string
  history?: string
  examination?: string
  assessment?: string
  plan?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface Diagnosis {
  id: string
  patientId: string
  medicalRecordId?: string
  doctorId?: string
  diagnosisCode?: string
  diagnosisName: string
  diagnosedDate: string
  severity?: 'mild' | 'moderate' | 'severe' | 'critical'
  status: 'active' | 'resolved' | 'chronic'
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface Prescription {
  id: string
  patientId: string
  doctorId: string
  medicalRecordId?: string
  prescribedDate: string
  status: 'active' | 'completed' | 'cancelled' | 'expired'
  notes?: string
  items?: PrescriptionItem[]
  createdAt: string
  updatedAt?: string
}

export interface PrescriptionItem {
  id: string
  prescriptionId: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  isDispensed: boolean
  createdAt: string
}

export interface LabResult {
  id: string
  patientId: string
  medicalRecordId?: string
  testName: string
  testType?: string
  orderedBy?: string
  orderedDate: string
  performedDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  results?: any
  interpretation?: string
  fileUrl?: string
  isAbnormal: boolean
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface ImagingResult {
  id: string
  patientId: string
  medicalRecordId?: string
  imagingType: string
  bodyPart?: string
  orderedBy?: string
  orderedDate: string
  performedDate?: string
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled'
  reportText?: string
  imageUrls?: string[]
  impression?: string
  radiologistName?: string
  createdAt: string
  updatedAt?: string
}

export interface VitalSign {
  id: string
  patientId: string
  visitDate: string
  temperature?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  weight?: number
  height?: number
  bmi?: number
  notes?: string
  recordedBy?: string
  createdAt: string
}

// ============================================================================
// Doctor Management Types
// ============================================================================

export interface DoctorProfile {
  id: string
  userId: string
  specialization: string
  licenseNumber?: string
  bioAr?: string
  bioEn?: string
  education?: string
  experienceYears?: number
  consultationFee?: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface DoctorSchedule {
  id: string
  doctorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  breakStart?: string
  breakEnd?: string
  slotDuration: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface AppointmentSlot {
  id: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  isBooked: boolean
  appointmentId?: string
  createdAt: string
}

// ============================================================================
// Operations & Billing Types
// ============================================================================

export interface ReceptionQueue {
  id: string
  patientId: string
  appointmentId?: string
  queueNumber: number
  status: 'waiting' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'
  checkedInAt: string
  calledAt?: string
  completedAt?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  patientId: string
  appointmentId?: string
  status: 'pending' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded'
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  dueDate?: string
  paidAt?: string
  notes?: string
  insuranceClaimId?: string
  items?: InvoiceItem[]
  createdAt: string
  updatedAt?: string
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  serviceType?: string
  createdAt: string
}

export interface InsuranceClaim {
  id: string
  patientId: string
  invoiceId?: string
  insuranceProvider: string
  policyNumber?: string
  claimType?: string
  serviceDate?: string
  totalAmount: number
  coveredAmount?: number
  patientResponsibility?: number
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'partially_approved' | 'rejected' | 'paid'
  submittedDate?: string
  processedDate?: string
  rejectionReason?: string
  resubmissionNotes?: string
  createdAt: string
  updatedAt?: string
}

export interface Notification {
  id: string
  userId?: string
  patientId?: string
  type: string
  title: string
  message: string
  entityType?: string
  entityId?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface SystemSetting {
  key: string
  value: string
  description?: string
  updatedAt?: string
}

export interface SystemSettings {
  // AI Settings
  GEMINI_KEY: string
  OPENAI_KEY: string

  // WhatsApp Settings
  WHATSAPP_TOKEN: string
  WHATSAPP_PHONE_NUMBER_ID: string
  WHATSAPP_VERIFY_TOKEN: string

  // Google Calendar Settings
  GOOGLE_CLIENT_EMAIL: string
  GOOGLE_PRIVATE_KEY: string
  GOOGLE_CALENDAR_ID: string

  // CRM Settings
  CRM_URL: string
  CRM_TOKEN: string

  [key: string]: string
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  location?: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
}

// ============================================================================
// AI Types
// ============================================================================

export interface AIResponse {
  text: string
  model: 'gemini' | 'openai'
  error?: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ConversationHistory {
  id: string
  userPhone: string
  userMessage: string
  aiResponse: string
  sessionId?: string
  createdAt: string
}

// ============================================================================
// WhatsApp Types
// ============================================================================

export interface WhatsAppMessage {
  from: string
  text: string
  messageId?: string
  timestamp?: string
}

export interface WhatsAppWebhookPayload {
  object?: string
  entry?: Array<{
    id?: string
    changes?: Array<{
      value?: {
        messaging_product?: string
        metadata?: {
          display_phone_number?: string
          phone_number_id?: string
        }
        contacts?: Array<{
          profile?: {
            name?: string
          }
          wa_id?: string
        }>
        messages?: Array<{
          from?: string
          id?: string
          timestamp?: string
          type?: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'interactive' | 'button'
          text?: { body?: string }
          audio?: {
            id?: string
            mime_type?: string
            sha?: string
          }
          image?: {
            id?: string
            mime_type?: string
            sha?: string
            caption?: string
          }
          document?: {
            id?: string
            mime_type?: string
            sha?: string
            filename?: string
            caption?: string
          }
          interactive?: {
            type?: 'button_reply' | 'list_reply'
            button_reply?: {
              id?: string
              title?: string
            }
            list_reply?: {
              id?: string
              title?: string
              description?: string
            }
          }
        }>
        statuses?: Array<{
          id?: string
          status?: 'sent' | 'delivered' | 'read' | 'failed'
          recipient_id?: string
          timestamp?: string
        }>
      }
      field?: string
    }>
  }>
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormError {
  field: string
  message: string
}

export interface FormState<T = any> {
  data: T
  errors: FormError[]
  isSubmitting: boolean
  isValid: boolean
}

// ============================================================================
// UI Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// ============================================================================
// Utility Types
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
