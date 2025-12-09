'use client'

import { FileText, Plus, Search, Edit, Trash2, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  category: string
  template_content: any
  is_default: boolean
  is_active: boolean
  created_at: string
}

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (categoryFilter !== 'all') {
      fetchTemplates()
    }
  }, [categoryFilter])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data || [])
      } else {
        console.error('Error fetching templates:', data.error)
        setTemplates([])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      greeting: 'ترحيب',
      appointment: 'مواعيد',
      reminder: 'تذكير',
      notification: 'إشعار',
      custom: 'مخصص'
    }
    return categories[category] || category
  }

  const handleEdit = async (template: Template) => {
    toast.info(`تعديل القالب: ${template.name}\n\nسيتم إضافة نافذة التعديل قريباً`)
  }

  const handleCopy = async (template: Template) => {
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (نسخة)`,
          category: template.category,
          template_content: template.template_content,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('تم نسخ القالب بنجاح')
        await fetchTemplates()
      } else {
        toast.error('فشل نسخ القالب: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error copying template:', error)
      toast.error('حدث خطأ أثناء نسخ القالب')
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return
    
    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        toast.success('تم حذف القالب بنجاح')
        await fetchTemplates()
      } else {
        toast.error('فشل حذف القالب: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('حدث خطأ أثناء حذف القالب')
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">قوالب الرسائل</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة قوالب رسائل الواتساب</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          قالب جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن قالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">جميع الفئات</option>
              <option value="greeting">ترحيب</option>
              <option value="appointment">مواعيد</option>
              <option value="reminder">تذكير</option>
              <option value="notification">إشعار</option>
              <option value="custom">مخصص</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي القوالب</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{templates.length}</p>
            </div>
            <FileText className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">افتراضي</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {templates.filter(t => t.is_default).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">نشط</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {templates.filter(t => t.is_active).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد قوالب</p>
          <p className="text-sm text-gray-400 mt-2">ابدأ بإنشاء قالب جديد للرسائل</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-xs text-gray-500">{getCategoryText(template.category)}</p>
                  </div>
                </div>
                {template.is_default && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">افتراضي</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                    title="تعديل"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleCopy(template)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="نسخ"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.is_active ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
