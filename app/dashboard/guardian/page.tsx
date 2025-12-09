'use client'

/**
 * Guardian Dashboard
 * Dashboard for guardians to view their linked patients and pending approvals
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Users, UserCheck, Calendar, FileText, AlertCircle, Shield } from 'lucide-react'

interface Patient {
  id: string
  name: string
  phone: string
  date_of_birth?: string
  gender?: string
  relationship_type: string
  is_primary: boolean
}

interface PendingApproval {
  id: string
  patient_id: string
  patient_name: string
  procedure_type: string
  description: string
  requested_at: string
  status: string
}

export default function GuardianDashboard() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingApprovals: 0,
    upcomingAppointments: 0,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load patients
      const patientsRes = await fetch('/api/guardian/patients')
      const patientsData = await patientsRes.json()
      if (patientsData.success) {
        setPatients(patientsData.data || [])
        setStats((prev) => ({ ...prev, totalPatients: patientsData.data?.length || 0 }))
      }

      // Load pending approvals
      const approvalsRes = await fetch('/api/guardian/notifications?type=approval')
      const approvalsData = await approvalsRes.json()
      if (approvalsData.success) {
        // Handle both array and object with notifications property
        const notifications = Array.isArray(approvalsData.data) 
          ? approvalsData.data 
          : approvalsData.data?.notifications || []
        const approvals = notifications.filter((a: PendingApproval) => a.status === 'pending') || []
        setPendingApprovals(approvals)
        setStats((prev) => ({ ...prev, pendingApprovals: approvals.length }))
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Continue to show dashboard even if some data fails to load
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل لوحة التحكم...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">لوحة تحكم ولي الأمر</h1>
        <p className="text-gray-500 text-lg">نظرة شاملة على المرضى المرتبطين بك</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Users size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalPatients}</div>
          <div className="text-sm text-gray-500">المرضى المرتبطين</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
              <UserCheck size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingApprovals}</div>
          <div className="text-sm text-gray-500">الموافقات المعلقة</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <Calendar size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingAppointments}</div>
          <div className="text-sm text-gray-500">المواعيد القادمة</div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={24} className="text-orange-500" />
            الموافقات المعلقة
          </h2>
          <div className="space-y-3">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="p-4 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 transition"
                onClick={() => router.push(`/dashboard/guardian/approvals?approval=${approval.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 mb-1">{approval.patient_name}</div>
                    <div className="text-sm text-gray-600 mb-2">{approval.procedure_type}</div>
                    <div className="text-xs text-gray-500">{approval.description}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(approval.requested_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patients List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} />
            المرضى المرتبطين
          </h2>
          <button
            onClick={() => router.push('/dashboard/guardian/patients')}
            className="text-sm text-primary hover:underline"
          >
            عرض الكل
          </button>
        </div>

        {patients.length === 0 ? (
          <div className="text-center text-gray-400 py-8">لا توجد مرضى مرتبطين</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.slice(0, 6).map((patient) => (
              <div
                key={patient.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => router.push(`/dashboard/guardian/patients/${patient.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-gray-900">{patient.name}</div>
                  {patient.is_primary && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">ولي أمر رئيسي</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-2">نوع العلاقة: {patient.relationship_type}</div>
                {patient.phone && (
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <span>📱</span>
                    {patient.phone}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

