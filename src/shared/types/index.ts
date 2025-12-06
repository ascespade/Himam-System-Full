// Centralized TypeScript types

export interface Specialist {
  id: string
  name: string
  specialty: string
  nationality: string
  email: string
  phone?: string
  bio?: string
  image?: string
}

export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth?: string
  nationality?: string
  createdAt: string
}

export interface Session {
  id: string
  patientId: string
  specialistId: string
  date: string
  notes?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

export interface Service {
  id: string
  title: string
  description: string
  icon: string
}


