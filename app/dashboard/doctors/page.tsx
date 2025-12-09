'use client'

import { useState, useEffect } from 'react'
import { User, Stethoscope, GraduationCap, Award, Mail, Phone, Calendar, Users, MessageSquare, Eye, Edit, Plus, Search, DollarSign } from 'lucide-react'
import Modal from '@/components/Modal'

interface DoctorProfile {
  id: string
  user_id: string
  user_name: string
  user_email: string
  specialization: string
  license_number?: string
  license_expiry?: string
  years_of_experience?: number
  education?: string[]
  certifications?: string[]
  languages?: string[]
  bio?: string
  consultation_fee?: number
  image_url?: string
  patient_count?: number
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/doctors/profiles')
      const data = await res.json()
      if (data.success) {
        setDoctors(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewProfile = async (doctorId: string) => {
    try {
      const res = await fetch(`/api/doctors/profiles/${doctorId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedDoctor(data.data)
        setShowProfileModal(true)
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error)
    }
  }

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.user_email && doctor.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSpecialization = selectedSpecialization === 'all' || doctor.specialization === selectedSpecialization
    
    return matchesSearch && matchesSpecialization
  })

  const specializations = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">بروفايلات الأطباء</h1>
        <p className="text-gray-500 text-lg">عرض وإدارة معلومات الأطباء</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن طبيب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {specializations.length > 0 && (
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">جميع التخصصات</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          )}

          <button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
            <Plus size={20} />
            إضافة طبيب
          </button>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl">
            {loading ? 'جاري التحميل...' : 'لا توجد نتائج'}
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4 mb-4">
                {doctor.image_url ? (
                  <img
                    src={doctor.image_url}
                    alt={doctor.user_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                    {doctor.user_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{doctor.user_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-primary font-bold">
                    <Stethoscope size={16} />
                    {doctor.specialization}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {doctor.user_email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    {doctor.user_email}
                  </div>
                )}
                {doctor.years_of_experience && (
                  <div className="flex items-center gap-2">
                    <Award size={14} />
                    {doctor.years_of_experience} سنة خبرة
                  </div>
                )}
                {doctor.consultation_fee && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} />
                    {doctor.consultation_fee} ر.س
                  </div>
                )}
                {doctor.patient_count !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    {doctor.patient_count} مريض
                  </div>
                )}
              </div>

              {doctor.languages && doctor.languages.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">اللغات:</div>
                  <div className="flex flex-wrap gap-1">
                    {doctor.languages.map((lang, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => viewProfile(doctor.id)}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-sm transition-colors"
                >
                  <Eye size={16} className="inline ml-1" />
                  عرض البروفايل
                </button>
                <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">
                  <MessageSquare size={16} className="inline ml-1" />
                  Slack
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false)
          setSelectedDoctor(null)
        }}
        title={selectedDoctor ? `بروفايل الدكتور ${selectedDoctor.user_name}` : 'بروفايل الطبيب'}
        size="lg"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الاسم</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedDoctor.user_name}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">التخصص</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedDoctor.specialization}</div>
              </div>
              {selectedDoctor.user_email && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedDoctor.user_email}</div>
                </div>
              )}
              {selectedDoctor.years_of_experience && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">سنوات الخبرة</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedDoctor.years_of_experience} سنة</div>
                </div>
              )}
              {selectedDoctor.license_number && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الرخصة</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedDoctor.license_number}</div>
                </div>
              )}
              {selectedDoctor.consultation_fee && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رسوم الاستشارة</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedDoctor.consultation_fee} ر.س</div>
                </div>
              )}
            </div>

            {/* Education */}
            {selectedDoctor.education && selectedDoctor.education.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">التعليم</label>
                <div className="space-y-2">
                  {selectedDoctor.education.map((edu, idx) => (
                    <div key={idx} className="px-4 py-2 bg-gray-50 rounded-lg">{edu}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {selectedDoctor.certifications && selectedDoctor.certifications.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الشهادات</label>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.certifications.map((cert, idx) => (
                    <span key={idx} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {selectedDoctor.languages && selectedDoctor.languages.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اللغات</label>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.languages.map((lang, idx) => (
                    <span key={idx} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {selectedDoctor.bio && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نبذة</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedDoctor.bio}</div>
              </div>
            )}

            {/* Patient Count */}
            {selectedDoctor.patient_count !== undefined && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">عدد المرضى</span>
                  <span className="text-2xl font-bold text-primary">{selectedDoctor.patient_count}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

