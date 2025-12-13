'use client'

import { useState, useEffect } from 'react'
import Footer from '../../../components/Footer'
import Modal from '../../../components/Modal'
import { logError } from '@/shared/utils/logger'
import { toastError } from '@/shared/utils/toast'

// --- Types ---
interface Patient { 
  id: string
  name: string
  phone: string; 
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
  image_url?: string 
}

interface Appointment { 
  id: string
  patient_name: string
  phone: string
  specialist: string
  date: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string 
}

interface ContentItem { 
  id: string
  type: 'service' | 'testimonial'
  title_ar: string
  description_ar: string
  is_active: boolean 
}

interface ChatMessage { 
  id: string
  user_message: string
  ai_response: string
  created_at: string 
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'patients' | 'cms'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data
  const [patients, setPatients] = useState<Patient[]>([])
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  
  // Interactions
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null) // For loading states on buttons

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pRes, sRes, aRes, cRes] = await Promise.all([
        fetch('/api/patients'), fetch('/api/specialists'), fetch('/api/appointments'), fetch('/api/cms')
      ])
      
      try {
        const pData = await pRes.json(); setPatients(pData.success ? pData.data : [])
      } catch(e) { 
        logError('Error loading patients', e, { endpoint: '/api/patients' })
        setError('فشل تحميل بيانات المرضى')
      }
      
      try {
        const sData = await sRes.json(); setSpecialists(sData.success ? sData.data : [])
      } catch(e) { 
        logError('Error loading specialists', e, { endpoint: '/api/specialists' })
        setError('فشل تحميل بيانات الأطباء')
      }

      try {
        const aData = await aRes.json(); setAppointments(aData.success ? aData.data : [])
      } catch(e) { 
        logError('Error loading appointments', e, { endpoint: '/api/appointments' })
        setError('فشل تحميل بيانات المواعيد')
      }

      try {
        const cData = await cRes.json(); setContentItems(cData.success ? cData.data : [])
      } catch(e) { 
        logError('Error loading content items', e, { endpoint: '/api/cms' })
        setError('فشل تحميل بيانات المحتوى')
      }

    } catch (e) { 
       logError('Error loading dashboard data', e)
       setError('حدث خطأ أثناء تحميل البيانات')
    } finally { 
       setLoading(false) 
    }
  }

  // --- Appointment Actions ---
  const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    setProcessingId(id)
    try {
       const res = await fetch(`/api/appointments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
       })
       const data = await res.json()
       if (data.success) {
          // Update local state
          setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
       } else {
          const errorMessage = data.error || 'خطأ غير معروف'
          logError('Failed to update appointment status', new Error(errorMessage), { appointmentId: id, status })
          toastError('خطأ: ' + errorMessage)
       }
    } catch (e) { 
      logError('Error updating appointment status', e, { appointmentId: id, status })
      toastError('خطأ في الاتصال')
    } 
    finally { setProcessingId(null) }
  }

  // --- Chat ---
  const openChat = async (patient: Patient) => {
    setSelectedPatientName(patient.name)
    setShowChatModal(true)
    setChatHistory([])
    try {
       const res = await fetch(`/api/chat-history?phone=${patient.phone}`)
       const data = await res.json()
       if (data.success) setChatHistory(data.data)
       else {
         logError('Failed to load chat history', new Error(data.error || 'Unknown error'), { patientPhone: patient.phone })
         toastError('فشل تحميل سجل المحادثة')
       }
    } catch (e) { 
      logError('Error loading chat history', e, { patientPhone: patient.phone })
      toastError('خطأ في تحميل سجل المحادثة')
    }
  }

  // --- Components ---
  const BentoCard = ({ title, value, icon, sub, className }: { title: string; value: string | number; icon: React.ReactNode; sub?: string; className?: string }) => (
     <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${className}`}>
        <div className="flex justify-between items-start mb-4">
           <div className={`p-3 rounded-2xl ${sub ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-500'}`}>{icon}</div>
           {sub && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">{sub}</span>}
        </div>
        <h3 className="text-4xl font-extrabold text-gray-900 mb-1 font-english">{value}</h3>
        <p className="text-gray-500 font-medium">{title}</p>
     </div>
  )

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => { setError(null); loadData() }}
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-primary/20">
      <main className="max-w-[1400px] mx-auto p-4 md:p-8">
         <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">لوحة القيادة</h1>
              <p className="text-gray-500 text-lg">نظرة شاملة على أداء مركز الهمم الطبي</p>
            </div>
            <div className="flex gap-2 bg-white p-1.5 rounded-full border border-gray-200 shadow-sm overflow-x-auto max-w-full">
               {['overview', 'appointments', 'patients', 'cms'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as 'overview' | 'appointments' | 'patients' | 'cms')}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                       activeTab === tab 
                       ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                       : 'bg-transparent text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                     {tab === 'overview' ? 'الرئيسية' : tab === 'appointments' ? 'المواعيد' : tab === 'patients' ? 'المرضى' : 'المحتوى'}
                  </button>
               ))}
            </div>
         </header>

         {/* OVERVIEW BENTO GRID */}
         {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">
               <BentoCard 
                  title="إجمالي المرضى" 
                  value={patients.length} 
                  icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                  className="md:col-span-2 bg-gradient-to-br from-white to-orange-50/50"
               />
               <BentoCard 
                  title="مواعيد اليوم" 
                  value={appointments.filter(a => new Date(a.date).getDate() === new Date().getDate()).length} 
                  icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  sub="+12%"
               />
               <BentoCard 
                  title="بانتظار التأكيد" 
                  value={appointments.filter(a => a.status === 'pending').length} 
                  icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  className="bg-orange-500 text-white !border-orange-600"
               />
               
               {/* Quick Actions */}
               <div className="md:col-span-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                     <h3 className="text-xl font-bold mb-1">الوصول السريع</h3>
                     <p className="text-gray-400">إجراءات إدارية شائعة</p>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                     <button className="flex-1 md:flex-none bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors">+ إضافة مريض</button>
                     <button className="flex-1 md:flex-none bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">تصدير التقرير</button>
                  </div>
               </div>
            </div>
         )}

         {/* APPOINTMENTS TAB */}
         {activeTab === 'appointments' && (
            <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[800px]">
                  <thead>
                     <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="py-4 font-semibold px-4">المريض</th>
                        <th className="py-4 font-semibold px-4">الطبيب</th>
                        <th className="py-4 font-semibold px-4">الموعد</th>
                        <th className="py-4 font-semibold px-4">الحالة</th>
                        <th className="py-4 font-semibold px-4">الإجراء</th>
                     </tr>
                  </thead>
                  <tbody>
                     {appointments.map(apt => (
                        <tr key={apt.id} className="group hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0">
                           <td className="py-5 px-4">
                              <div className="font-bold text-gray-900">{apt.patient_name}</div>
                              <div className="text-xs text-gray-400" dir="ltr">{apt.phone}</div>
                           </td>
                           <td className="py-5 px-4 text-gray-600">{apt.specialist}</td>
                           <td className="py-5 px-4">
                              <div className="font-english font-medium">{new Date(apt.date).toLocaleDateString('en-GB')}</div>
                              <div className="text-xs text-gray-400 font-english">{new Date(apt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit'})}</div>
                           </td>
                           <td className="py-5 px-4">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                 apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                 apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                 'bg-amber-100 text-amber-700'
                              }`}>
                                 {apt.status === 'confirmed' ? 'مؤكد' : apt.status === 'pending' ? 'انتظار' : 'ملغي'}
                              </span>
                           </td>
                           <td className="py-5 px-4">
                              {apt.status === 'pending' && (
                                 <div className="flex gap-2 transition-opacity">
                                    <button 
                                      onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                                      disabled={processingId === apt.id}
                                      className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-800 disabled:opacity-50"
                                    >
                                       {processingId === apt.id ? '...' : 'قبول'}
                                    </button>
                                    <button 
                                      onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                                      disabled={processingId === apt.id}
                                      className="bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 disabled:opacity-50"
                                    >
                                       رفض
                                    </button>
                                 </div>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               </div>
            </div>
         )}
         
         {/* PATIENTS TABLE */}
         {activeTab === 'patients' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map(p => (
                   <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">👤</div>
                         <button 
                           onClick={() => openChat(p)}
                           className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-primary hover:text-white transition-colors"
                         >
                            <span>محادثة</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                         </button>
                      </div>
                      <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                      <p className="text-gray-400 text-sm mb-4 font-english" dir="ltr">{p.phone}</p>
                      <div className="flex gap-2 text-xs">
                         <span className="bg-gray-50 px-2 py-1 rounded text-gray-500">{p.nationality}</span>
                         <span className="bg-green-50 px-2 py-1 rounded text-green-600 font-medium">نشط</span>
                      </div>
                   </div>
                ))}
             </div>
         )}

         {/* CMS / Content */}
         {activeTab === 'cms' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400 text-2xl">+</div>
                   <h3 className="font-bold text-lg">إضافة خدمة جديدة</h3>
                   <p className="text-gray-400 text-sm mt-2">قم بإنشاء بطاقة خدمة جديدة للموقع</p>
                </div>
                {contentItems.map(item => (
                   <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                      <div className="flex justify-between mb-4">
                         <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.type}</span>
                         <div className={`w-3 h-3 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      </div>
                      <h3 className="font-bold text-xl mb-2">{item.title_ar}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.description_ar}</p>
                      <div className="mt-6 flex gap-3">
                         <button className="flex-1 bg-gray-50 py-2 rounded-xl text-xs font-bold hover:bg-gray-100">تعديل</button>
                         <button className="flex-1 bg-red-50 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-100">حذف</button>
                      </div>
                   </div>
                ))}
             </div>
         )}
      </main>

      <Footer />
      
      {/* CHAT MODAL */}
      <Modal isOpen={showChatModal} onClose={() => setShowChatModal(false)} title={selectedPatientName} size="lg">
         <div className="h-[500px] flex flex-col bg-[#F5F7FB] rounded-xl p-4 overflow-y-auto space-y-3">
            {chatHistory.length === 0 ? <p className="text-center text-gray-400 my-auto">لا توجد رسائل</p> : chatHistory.map(m => (
               <div key={m.id} className="flex flex-col gap-1">
                  <div className="bg-primary text-white self-end rounded-2xl rounded-tr-none px-4 py-2 text-sm max-w-[85%] shadow-sm">
                     {m.user_message}
                  </div>
                  <div className="bg-white text-gray-800 self-start rounded-2xl rounded-tl-none px-4 py-2 text-sm max-w-[85%] shadow-sm border border-gray-100">
                     {m.ai_response}
                  </div>
               </div>
            ))}
         </div>
      </Modal>
    </div>
  )
}
