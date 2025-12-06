'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

interface Patient {
  id: string
  name: string
  phone: string
  nationality: string
  status: string
  created_at: string
}

interface Specialist {
  id: string
  name: string
  specialty: string
  nationality: string
  email: string
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [activeTab, setActiveTab] = useState<'patients' | 'specialists' | 'cms'>('patients')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [patientsRes, specialistsRes] = await Promise.all([
        supabase.from('patients').select('*').order('created_at', { ascending: false }),
        supabase.from('specialists').select('*')
      ])

      if (patientsRes.data) setPatients(patientsRes.data)
      if (specialistsRes.data) setSpecialists(specialistsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">لوحة تحكم الإدارة</h1>

          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'patients'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  المرضى ({patients.length})
                </button>
                <button
                  onClick={() => setActiveTab('specialists')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'specialists'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  الأخصائيون ({specialists.length})
                </button>
                <button
                  onClick={() => setActiveTab('cms')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'cms'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  إدارة المحتوى
                </button>
              </nav>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-500">جاري التحميل...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'patients' && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجوال</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجنسية</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {patients.map((patient) => (
                            <tr key={patient.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{patient.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.nationality}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {patient.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(patient.created_at).toLocaleDateString('ar-SA')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === 'specialists' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {specialists.map((specialist) => (
                        <div key={specialist.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-2">{specialist.name}</h3>
                          <p className="text-blue-600 mb-2">{specialist.specialty}</p>
                          <p className="text-sm text-gray-600 mb-1">الجنسية: {specialist.nationality}</p>
                          <p className="text-sm text-gray-600">البريد: {specialist.email}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'cms' && (
                    <div className="space-y-4">
                      <p className="text-gray-600">إدارة محتوى الموقع والجلسات الطبية.</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">ميزات إدارة المحتوى</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          <li>تعديل محتوى الصفحات</li>
                          <li>إدارة الجلسات والمواعيد</li>
                          <li>تحديث معلومات الأخصائيين</li>
                          <li>إدارة التقارير الطبية</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
