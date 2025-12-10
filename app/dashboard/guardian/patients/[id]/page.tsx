'use client'

/**
 * Guardian Patient Details
 * Detailed view of a patient for guardians
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowRight, FileText, Calendar, Shield, Phone, User } from 'lucide-react'

interface Patient {
  id: string
  name: string
  phone: string
  date_of_birth?: string
  gender?: string
  relationship_type: string
  permissions: {
    view_records: boolean
    view_appointments: boolean
    approve_procedures: boolean
    view_billing: boolean
  }
}

interface MedicalRecord {
  id: string
  record_type: string
  chief_complaint?: string
  date: string
  doctor_name?: string
}

interface Appointment {
  id: string
  date: string
  status: string
  doctor_name?: string
}

export default function GuardianPatientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'appointments'>('overview')

  const loadPatientData = useCallback(async () => {
    try {
      setLoading(true)

      // Load patient details
      const patientRes = await fetch(`/api/guardian/patients/${patientId}`)
      const patientData = await patientRes.json()
      if (patientData.success) {
        setPatient(patientData.data)
      }

      // Load records if permission allows
      if (patientData.data?.permissions?.view_records) {
        const recordsRes = await fetch(`/api/guardian/patients/${patientId}/records`)
        const recordsData = await recordsRes.json()
        if (recordsData.success) {
          setRecords(recordsData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading patient data:', error)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (patientId) {
      loadPatientData()
    }
  }, [patientId, loadPatientData])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري التحميل...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">المريض غير موجود</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/guardian/patients')}
          className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
        >
          ← العودة للقائمة
        </button>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{patient.name}</h1>
        <p className="text-gray-500 text-lg">معلومات المريض والسجلات الطبية</p>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات المريض</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-gray-400" />
            <span className="text-gray-600">{patient.phone}</span>
          </div>
          {patient.date_of_birth && (
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <span className="text-gray-600">
                {new Date(patient.date_of_birth).toLocaleDateString('ar-SA')}
              </span>
            </div>
          )}
          {patient.gender && (
            <div className="flex items-center gap-2">
              <User size={18} className="text-gray-400" />
              <span className="text-gray-600">{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-gray-400" />
            <span className="text-gray-600">نوع العلاقة: {patient.relationship_type}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          نظرة عامة
        </button>
        {patient.permissions.view_records && (
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'records'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            السجلات الطبية ({records.length})
          </button>
        )}
        {patient.permissions.view_appointments && (
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'appointments'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            المواعيد ({appointments.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">الصلاحيات</h3>
            <div className="grid grid-cols-2 gap-4">
              {patient.permissions.view_records && (
                <div className="flex items-center gap-2 text-green-600">
                  <span>✓</span>
                  <span>عرض السجلات الطبية</span>
                </div>
              )}
              {patient.permissions.view_appointments && (
                <div className="flex items-center gap-2 text-green-600">
                  <span>✓</span>
                  <span>عرض المواعيد</span>
                </div>
              )}
              {patient.permissions.approve_procedures && (
                <div className="flex items-center gap-2 text-green-600">
                  <span>✓</span>
                  <span>الموافقة على الإجراءات</span>
                </div>
              )}
              {patient.permissions.view_billing && (
                <div className="flex items-center gap-2 text-green-600">
                  <span>✓</span>
                  <span>عرض الفواتير</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && patient.permissions.view_records && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">السجلات الطبية</h3>
          {records.length === 0 ? (
            <div className="text-center text-gray-400 py-8">لا توجد سجلات طبية</div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-1">{record.record_type}</div>
                      {record.chief_complaint && (
                        <div className="text-sm text-gray-600 mb-2">{record.chief_complaint}</div>
                      )}
                      {record.doctor_name && (
                        <div className="text-xs text-gray-500">الطبيب: {record.doctor_name}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(record.date).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && patient.permissions.view_appointments && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">المواعيد</h3>
          {appointments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">لا توجد مواعيد</div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-1">
                        {new Date(appointment.date).toLocaleDateString('ar-SA')}
                      </div>
                      {appointment.doctor_name && (
                        <div className="text-sm text-gray-600">الطبيب: {appointment.doctor_name}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        الحالة: {appointment.status === 'confirmed' ? 'مؤكد' : appointment.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

