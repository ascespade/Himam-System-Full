'use client'

import { ChevronRight, Save, Search, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface Patient {
  id: string
  name: string
  phone: string
}

export default function BookAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    date: '',
    time: '',
    duration: 30,
    notes: ''
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchPatients()
    }
  }, [searchTerm])

  const fetchDoctors = async () => {
    try {
      // Fetch doctors (users with role 'doctor')
      const res = await fetch('/api/users?role=doctor')
      const data = await res.json()
      if (data.success) {
        setDoctors(data.data)
      }
    } catch (err) {
      console.error('Error fetching doctors:', err)
    }
  }

  const searchPatients = async () => {
    try {
      const res = await fetch(`/api/patients/search?q=${searchTerm}`)
      const data = await res.json()
      if (data.success) {
        setPatients(data.data)
      }
    } catch (err) {
      console.error('Error searching patients:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const appointmentDate = new Date(`${formData.date}T${formData.time}`)

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id,
          date: appointmentDate.toISOString(),
          duration: Number(formData.duration),
          notes: formData.notes
        })
      })

      const data = await res.json()

      if (data.success) {
        router.push('/dashboard/reception')
        router.refresh()
      } else {
        setError(Array.isArray(data.error) ? data.error[0].message : data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-500 mb-6">
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/reception')}>الاستقبال</span>
        <ChevronRight size={16} />
        <span className="font-bold text-gray-900">حجز موعد جديد</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">حجز موعد جديد</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Patient Search */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">المريض</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Patient Results */}
            {searchTerm.length > 2 && patients.length > 0 && !formData.patient_id && (
              <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {patients.map(patient => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setFormData({ ...formData, patient_id: patient.id })
                      setSearchTerm(patient.name)
                      setPatients([])
                    }}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between"
                  >
                    <span className="font-bold">{patient.name}</span>
                    <span className="text-gray-500">{patient.phone}</span>
                  </div>
                ))}
              </div>
            )}
            {formData.patient_id && (
               <div className="mt-2 text-sm text-green-600 font-bold flex items-center gap-1">
                 <User size={14} />
                 تم اختيار المريض
               </div>
            )}
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الطبيب</label>
            <select
              required
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">اختر الطبيب...</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialization}</option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">التاريخ</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الوقت</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المدة (دقيقة)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="15">15 دقيقة</option>
                <option value="30">30 دقيقة</option>
                <option value="45">45 دقيقة</option>
                <option value="60">60 دقيقة</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="سبب الزيارة..."
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'جاري الحجز...' : (
                <>
                  <Save size={20} />
                  تأكيد الحجز
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
