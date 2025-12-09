'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Save } from 'lucide-react'
// import { toast } from 'sonner' // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}

interface WhatsAppTemplate {
  id: string
  template_name: string
  display_name: string
  category: string
  language_code: string
  body_text: string
  header_text?: string
  footer_text?: string
  button_type?: string
  button_text?: string[]
  button_urls?: string[]
  status: string
  is_active: boolean
}

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<WhatsAppTemplate>>({
    category: 'UTILITY',
    language_code: 'ar',
    button_text: [],
    button_urls: [],
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/whatsapp/templates')
      const data = await res.json()
      if (data.success) {
        setTemplates(data.data.local || [])
      } else {
        toast.error('فشل في تحميل القوالب: ' + data.error)
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      toast.error('خطأ في تحميل القوالب')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingId
        ? `/api/whatsapp/templates/${editingId}`
        : '/api/whatsapp/templates'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingId ? 'تم تحديث القالب' : 'تم إنشاء القالب')
        setShowAddForm(false)
        setEditingId(null)
        setFormData({ category: 'UTILITY', language_code: 'ar', button_text: [], button_urls: [] })
        fetchTemplates()
      } else {
        toast.error('فشل في حفظ القالب: ' + data.error)
      }
    } catch (error: any) {
      console.error('Error saving template:', error)
      toast.error('خطأ في حفظ القالب')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return

    try {
      const res = await fetch(`/api/whatsapp/templates/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف القالب')
        fetchTemplates()
      } else {
        toast.error('فشل في حذف القالب: ' + data.error)
      }
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error('خطأ في حذف القالب')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-green-500" />
      case 'rejected':
        return <XCircle size={16} className="text-red-500" />
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />
      default:
        return <Clock size={16} className="text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة قوالب الواتساب</h1>
          <p className="text-gray-500 mt-1">إنشاء وإدارة قوالب الرسائل</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true)
            setEditingId(null)
            setFormData({ category: 'UTILITY', language_code: 'ar', button_text: [], button_urls: [] })
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
        >
          <Plus size={20} />
          إضافة قالب جديد
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? 'تعديل القالب' : 'إضافة قالب جديد'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم القالب (Meta)</label>
                <input
                  type="text"
                  value={formData.template_name || ''}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="template_name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الاسم المعروض</label>
                <input
                  type="text"
                  value={formData.display_name || ''}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">التصنيف</label>
                <select
                  value={formData.category || 'UTILITY'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="MARKETING">تسويق</option>
                  <option value="UTILITY">خدمة</option>
                  <option value="AUTHENTICATION">مصادقة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اللغة</label>
                <select
                  value={formData.language_code || 'ar'}
                  onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نص الرأس (اختياري)</label>
              <input
                type="text"
                value={formData.header_text || ''}
                onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نص الرسالة *</label>
              <textarea
                rows={6}
                value={formData.body_text || ''}
                onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="نص الرسالة... يمكن استخدام {{variable}} للمتغيرات"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نص التذييل (اختياري)</label>
              <input
                type="text"
                value={formData.footer_text || ''}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
              >
                <Save size={20} />
                حفظ
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingId(null)
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الاسم</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">التصنيف</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">نشط</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    لا توجد قوالب
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{template.display_name}</div>
                      <div className="text-xs text-gray-500">{template.template_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{template.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(template.status)}
                        <span className="text-sm">{template.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          template.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {template.is_active ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(template.id)
                            setFormData(template)
                            setShowAddForm(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

