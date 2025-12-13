/**
 * Dashboard Type Definitions
 * Type definitions for Dashboard components
 */

import { ComponentType } from 'react'

export interface DashboardTab {
  id: string
  label: string
  icon: ComponentType<{ size?: number }>
}

export interface MedicalRecord {
  id: string
  record_type: string
  title: string
  description?: string
  notes?: string
  date: string
  created_at: string
  attachments?: string[]
  patient_id: string
  chief_complaint?: string
}

export interface TreatmentPlan {
  id: string
  title: string
  description?: string
  status: 'active' | 'completed' | 'cancelled'
  progress_percentage: number
  goals: Array<{
    id: string
    description: string
    status: string
    target_date: string
  }>
  patient_id: string
  created_at: string
  updated_at: string
  end_date?: string
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  appointment_type: string
  notes?: string
}

export interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  price: number
  total: number
}

export interface Invoice {
  id: string
  patient_id: string
  items: InvoiceItem[]
  total: number
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
}

export interface QueueItem {
  id: string
  patient_id: string
  patient_name: string
  patient_phone: string
  queue_number: number
  status: 'waiting' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  checked_in_at: string
  called_at?: string
  seen_at?: string
  appointment_id?: string
  appointment_time?: string
  doctor_name?: string
  notes?: string
}

export interface Patient {
  id: string
  name: string
  phone: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  blood_type?: string
  allergies?: string[]
  chronic_diseases?: string[]
  nationality?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  created_at: string
}

export interface Visit {
  id: string
  status: string
  visit_type: string
  created_at: string
  confirmed_to_doctor_time?: string
  doctor_seen_time?: string
  notes?: string
  reception_notes?: string
  patient_id: string
}

export interface SortConfig<T> {
  sortBy: keyof T
  sortOrder: 'asc' | 'desc'
}

export interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  template_content: Record<string, unknown>
  status: string
  created_at: string
}

export interface BusinessRule {
  id: string
  name: string
  condition: Record<string, unknown>
  action: string
  priority: number
  is_active: boolean
}

export interface WhatsAppFlow {
  id: string
  name: string
  trigger: Record<string, unknown>
  nodes: Array<Record<string, unknown>>
  edges: Array<Record<string, unknown>>
  is_active: boolean
}
