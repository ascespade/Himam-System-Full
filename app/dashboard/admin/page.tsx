'use client'

import { useState, useEffect } from 'react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Modal from '../../../components/Modal'

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

  description_ar: string | null
  value: string | null
  is_active: boolean
  order_index: number
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [activeTab, setActiveTab] = useState<'patients' | 'specialists' | 'cms'>('patients')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [showSpecialistModal, setShowSpecialistModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<'patient' | 'specialist' | null>(null)
  
  // Form states
  const [patientForm, setPatientForm] = useState({ name: '', phone: '', nationality: '', status: 'active' })
  const [specialistForm, setSpecialistForm] = useState({ name: '', specialty: '', nationality: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [patientsRes, specialistsRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/specialists')
      ])

      const patientsData = await patientsRes.json()
      const specialistsData = await specialistsRes.json()

      if (patientsData.success && patientsData.data) {
        setPatients(Array.isArray(patientsData.data) ? patientsData.data : [])
      }
      
      if (specialistsData.success && specialistsData.data) {
        setSpecialists(Array.isArray(specialistsData.data) ? specialistsData.data : [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  // Patient CRUD
  const openAddPatient = () => {
    setEditingPatient(null)
    setPatientForm({ name: '', phone: '', nationality: '', status: 'active' })
    setShowPatientModal(true)
  }

  const openEditPatient = (patient: Patient) => {
    setEditingPatient(patient)
    setPatientForm({
      name: patient.name,
      phone: patient.phone,
      nationality: patient.nationality,
      status: patient.status
    })
    setShowPatientModal(true)
  }

  const savePatient = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!patientForm.name || !patientForm.phone) {
        setError('الاسم والجوال مطلوبان')
        return
      }

      const url = editingPatient ? `/api/patients/${editingPatient.id}` : '/api/patients'
      const method = editingPatient ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientForm)
      })

      const data = await response.json()

      if (data.success) {
        await loadData()
        setShowPatientModal(false)
      } else {
        setError(data.error || 'فشل حفظ البيانات')
      }
    } catch (error) {
      console.error('Error saving patient:', error)
      setError('فشل حفظ البيانات')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (id: string, type: 'patient' | 'specialist') => {
    setDeletingId(id)
    setDeleteType(type)
    setShowDeleteConfirm(true)
  }

  const deletePatient = async () => {
    if (!deletingId) return

    try {
      setSaving(true)
      const response = await fetch(`/api/patients/${deletingId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await loadData()
        setShowDeleteConfirm(false)
        setDeletingId(null)
      } else {
        setError(data.error || 'فشل الحذف')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      setError('فشل الحذف')
    } finally {
      setSaving(false)
    }
  }

  // Specialist CRUD
  const openAddSpecialist = () => {
    setEditingSpecialist(null)
    setSpecialistForm({ name: '', specialty: '', nationality: '', email: '' })
    setShowSpecialistModal(true)
  }

  const openEditSpecialist = (specialist: Specialist) => {
    setEditingSpecialist(specialist)
    setSpecialistForm({
      name: specialist.name,
      specialty: specialist.specialty,
      nationality: specialist.nationality,
      email: specialist.email
    })
    setShowSpecialistModal(true)
  }

  const saveSpecialist = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!specialistForm.name || !specialistForm.specialty) {
        setError('الاسم والتخصص مطلوبان')
        return
      }

      const url = editingSpecialist ? `/api/specialists/${editingSpecialist.id}` : '/api/specialists'
      const method = editingSpecialist ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specialistForm)
      })

      const data = await response.json()

      if (data.success) {
        await loadData()
        setShowSpecialistModal(false)
      } else {
        setError(data.error || 'فشل حفظ البيانات')
      }
    } catch (error) {
      console.error('Error saving specialist:', error)
      setError('فشل حفظ البيانات')
    } finally {
      setSaving(false)
    }
  }

  const deleteSpecialist = async () => {
    if (!deletingId) return

    try {
      setSaving(true)
      const response = await fetch(`/api/specialists/${deletingId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await loadData()
        setShowDeleteConfirm(false)
        setDeletingId(null)
      } else {
        setError(data.error || 'فشل الحذف')
      }
    } catch (error) {
      console.error('Error deleting specialist:', error)
      setError('فشل الحذف')
    } finally {
      setSaving(false)
    }
  }

  // Filter patients by search term
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">لوحة تحكم الإدارة</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'patients'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  المرضى ({patients.length})
                </button>
                <button
                  onClick={() => setActiveTab('specialists')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'specialists'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  الأخصائيون ({specialists.length})
                </button>
                <button
                  onClick={() => setActiveTab('cms')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'cms'
                      ? 'border-primary text-primary'
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
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-4 text-gray-500">جاري التحميل...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'patients' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <input
                          type="text"
                          placeholder="بحث بالاسم أو الجوال..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <button
                          onClick={openAddPatient}
                          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                        >
                          + إضافة مريض
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجوال</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجنسية</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPatients.map((patient) => (
                              <tr key={patient.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{patient.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.nationality}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-light text-primary">
                                    {patient.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(patient.created_at).toLocaleDateString('ar-SA')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <button
                                    onClick={() => openEditPatient(patient)}
                                    className="text-blue-600 hover:text-blue-900 ml-3"
                                  >
                                    تعديل
                                  </button>
                                  <button
                                    onClick={() => confirmDelete(patient.id, 'patient')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    حذف
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'specialists' && (
                    <div>
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={openAddSpecialist}
                          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                        >
                          + إضافة أخصائي
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {specialists.map((specialist) => (
                          <div key={specialist.id} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-2">{specialist.name}</h3>
                            <p className="text-primary mb-2">{specialist.specialty}</p>
                            <p className="text-sm text-gray-600 mb-1">الجنسية: {specialist.nationality}</p>
                            <p className="text-sm text-gray-600 mb-4">البريد: {specialist.email}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditSpecialist(specialist)}
                                className="flex-1 bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => confirmDelete(specialist.id, 'specialist')}
                                className="flex-1 bg-red-50 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-100"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'cms' && (
                    <div className="space-y-4">
                      <p className="text-gray-600">إدارة محتوى الموقع (الخدمات، الشهادات، الإحصائيات).</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">ميزات إدارة المحتوى</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          <li>تعديل الخدمات المعروضة في الصفحة الرئيسية</li>
                          <li>إدارة شهادات العملاء</li>
                          <li>تحديث الإحصائيات</li>
                          <li>إضافة وحذف المحتوى</li>
                        </ul>
                        <p className="mt-4 text-sm text-gray-500">قريباً: واجهة كاملة لإدارة المحتوى</p>
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

      {/* Patient Modal */}
      <Modal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        title={editingPatient ? 'تعديل مريض' : 'إضافة مريض جديد'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
            <input
              type="text"
              value={patientForm.name}
              onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="اسم المريض"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الجوال *</label>
            <input
              type="tel"
              value={patientForm.phone}
              onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="+966xxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الجنسية</label>
            <input
              type="text"
              value={patientForm.nationality}
              onChange={(e) => setPatientForm({ ...patientForm, nationality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="سعودي"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <input
              type="text"
              value={patientForm.status}
              onChange={(e) => setPatientForm({ ...patientForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="نشط"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={savePatient}
              disabled={saving}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => setShowPatientModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Specialist Modal */}
      <Modal
        isOpen={showSpecialistModal}
        onClose={() => setShowSpecialistModal(false)}
        title={editingSpecialist ? 'تعديل أخصائي' : 'إضافة أخصائي جديد'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
            <input
              type="text"
              value={specialistForm.name}
              onChange={(e) => setSpecialistForm({ ...specialistForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="اسم الأخصائي"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التخصص *</label>
            <input
              type="text"
              value={specialistForm.specialty}
              onChange={(e) => setSpecialistForm({ ...specialistForm, specialty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="علاج النطق"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الجنسية</label>
            <input
              type="text"
              value={specialistForm.nationality}
              onChange={(e) => setSpecialistForm({ ...specialistForm, nationality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="سعودي"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={specialistForm.email}
              onChange={(e) => setSpecialistForm({ ...specialistForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="email@example.com"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={saveSpecialist}
              disabled={saving}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => setShowSpecialistModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف هذا {deleteType === 'patient' ? 'المريض' : 'الأخصائي'}؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-3">
            <button
              onClick={deleteType === 'patient' ? deletePatient : deleteSpecialist}
              disabled={saving}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'جاري الحذف...' : 'حذف'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
