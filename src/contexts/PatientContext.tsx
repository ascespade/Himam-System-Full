'use client'

/**
 * Patient Context System
 * نظام سياق المريض - يسمح للطبيب باختيار مريض والعمل معه
 * كل الجلسات والسجلات والخطط ترتبط تلقائياً بالمريض المختار
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Patient {
  id: string
  name: string
  phone: string
  date_of_birth?: string
  gender?: string
  blood_type?: string
  allergies?: string[]
  chronic_diseases?: string[]
  insurance_provider?: string
  last_visit?: string
  next_appointment?: string
  active_treatment_plans?: number
  total_sessions?: number
}

interface PatientContextType {
  currentPatient: Patient | null
  setCurrentPatient: (patient: Patient | null) => void
  recentPatients: Patient[]
  activePatients: Patient[]
  searchPatients: (query: string) => Promise<Patient[]>
  clearPatient: () => void
  isLoading: boolean
}

const PatientContext = createContext<PatientContextType | undefined>(undefined)

export function PatientProvider({ children }: { children: ReactNode }) {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null)
  const [recentPatients, setRecentPatients] = useState<Patient[]>([])
  const [activePatients, setActivePatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('doctor_current_patient')
    if (saved) {
      try {
        setCurrentPatient(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved patient:', e)
      }
    }
    loadRecentPatients()
    loadActivePatients()
  }, [])

  // Save to localStorage when patient changes
  useEffect(() => {
    if (currentPatient) {
      localStorage.setItem('doctor_current_patient', JSON.stringify(currentPatient))
      // Add to recent patients
      setRecentPatients(prev => {
        const filtered = prev.filter(p => p.id !== currentPatient.id)
        return [currentPatient, ...filtered].slice(0, 10) // Keep last 10
      })
    } else {
      localStorage.removeItem('doctor_current_patient')
    }
  }, [currentPatient])

  const loadRecentPatients = async () => {
    try {
      const res = await fetch('/api/doctor/patients?recent=true')
      const data = await res.json()
      if (data.success) {
        setRecentPatients(data.data || [])
      }
    } catch (error) {
      console.error('Error loading recent patients:', error)
    }
  }

  const loadActivePatients = async () => {
    try {
      const res = await fetch('/api/doctor/patients?active=true')
      const data = await res.json()
      if (data.success) {
        setActivePatients(data.data || [])
      }
    } catch (error) {
      console.error('Error loading active patients:', error)
    }
  }

  const searchPatients = async (query: string): Promise<Patient[]> => {
    if (!query || query.length < 2) return []
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/doctor/patients?search=${encodeURIComponent(query)}`)
      const data = await res.json()
      return data.success ? (data.data || []) : []
    } catch (error) {
      console.error('Error searching patients:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const clearPatient = () => {
    setCurrentPatient(null)
    localStorage.removeItem('doctor_current_patient')
  }

  return (
    <PatientContext.Provider
      value={{
        currentPatient,
        setCurrentPatient,
        recentPatients,
        activePatients,
        searchPatients,
        clearPatient,
        isLoading
      }}
    >
      {children}
    </PatientContext.Provider>
  )
}

export function usePatientContext() {
  const context = useContext(PatientContext)
  if (!context) {
    throw new Error('usePatientContext must be used within PatientProvider')
  }
  return context
}

