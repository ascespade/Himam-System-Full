'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Edit, Trash2, Eye, Search, Image as ImageIcon, Video, File, X, Save, Calendar, User, ArrowUpDown, ChevronRight, ChevronLeft } from 'lucide-react'
import Modal from '@/components/Modal'

interface ContentItem {
  id: string
  title: string
  type: 'article' | 'video' | 'image' | 'document'
  category: string
  status: 'published' | 'draft' | 'archived'
  created_at: string
  updated_at?: string
  views?: number
  author?: string
  description?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    type: 'article' as ContentItem['type'], 
    category: '', 
    status: 'draft' as ContentItem['status'],
    author: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'views'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchContent()
  }, [pagination.page, selectedType, selectedStatus, searchTerm, sortBy, sortOrder])

  const fetchContent = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/cms')
      const data = await res.json()
      if (data.success) {
        let items = data.data || []
        
        // Apply filters
        if (selectedType !== 'all') {
          items = items.filter((item: ContentItem) => item.type === selectedType)
        }
        if (selectedStatus !== 'all') {
          items = items.filter((item: ContentItem) => item.status === selectedStatus)
        }
        if (searchTerm) {
          items = items.filter((item: ContentItem) => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        }

        // Sort
        items.sort((a: ContentItem, b: ContentItem) => {
          let aVal: any = a[sortBy]
          let bVal: any = b[sortBy]
          if (sortBy === 'created_at') {
            aVal = new Date(aVal).getTime()
            bVal = new Date(bVal).getTime()
          }
          return sortOrder === 'asc' 
            ? (aVal > bVal ? 1 : -1)
            : (aVal < bVal ? 1 : -1)
        })

        // Pagination
        const start = (pagination.page - 1) * pagination.limit
        const end = start + pagination.limit
        setContent(items.slice(start, end))
        setPagination({
          ...pagination,
          total: items.length,
          totalPages: Math.ceil(items.length / pagination.limit)
        })
      } else {
        setError(data.error || 'فشل تحميل المحتوى')
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContent = () => {
    setFormData({ 
      title: '', 
      description: '', 
      type: 'article', 
      category: '', 
      status: 'draft',
      author: ''
    })
    setShowAddModal(true)
  }

  const handleEditContent = (item: ContentItem) => {
    setSelectedItem(item)
    setFormData({
      title: item.title,
      description: item.description || '',
      type: item.type,
      category: item.category,
      status: item.status,
      author: item.author || ''
    })
    setShowEditModal(true)
  }

  const handleDeleteContent = (item: ContentItem) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const handlePreview = (item: ContentItem) => {
    setSelectedItem(item)
    setShowPreviewModal(true)
  }

  const saveContent = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (!formData.title || !formData.type) {
        setError('العنوان والنوع مطلوبان')
        return
      }

      const url = selectedItem ? `/api/cms/${selectedItem.id}` : '/api/cms'
      const method = selectedItem ? 'PUT' : 'POST'
      const body = {
        ...formData,
        ...(selectedItem && { id: selectedItem.id })
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(selectedItem ? 'تم تحديث المحتوى بنجاح' : 'تم إضافة المحتوى بنجاح')
        setShowAddModal(false)
        setShowEditModal(false)
        setFormData({ 
          title: '', 
          description: '', 
          type: 'article', 
          category: '', 
          status: 'draft',
          author: ''
        })
        setSelectedItem(null)
        setTimeout(() => {
          fetchContent()
          setSuccess(null)
        }, 1000)
      } else {
        setError(data.error || 'فشل الحفظ')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      setError('حدث خطأ في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedItem) return

    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/cms/${selectedItem.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        setSuccess('تم حذف المحتوى بنجاح')
        setShowDeleteModal(false)
        setSelectedItem(null)
        setTimeout(() => {
          fetchContent()
          setSuccess(null)
        }, 1000)
      } else {
        setError(data.error || 'فشل الحذف')
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      setError('حدث خطأ في الحذف')
    } finally {
      setSaving(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText size={20} />
      case 'video': return <Video size={20} />
      case 'image': return <ImageIcon size={20} />
      case 'document': return <File size={20} />
      default: return <FileText size={20} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-700'
      case 'video': return 'bg-purple-100 text-purple-700'
      case 'image': return 'bg-green-100 text-green-700'
      case 'document': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'archived': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'منشور'
      case 'draft': return 'مسودة'
      case 'archived': return 'مؤرشف'
      default: return status
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'مقال'
      case 'video': return 'فيديو'
      case 'image': return 'صورة'
      case 'document': return 'مستند'
      default: return type
    }
  }

  if (loading && content.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة المحتوى</h1>
        <p className="text-gray-500 text-lg">إدارة المقالات والفيديوهات والصور والمستندات</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث في المحتوى..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الأنواع</option>
            <option value="article">مقالات</option>
            <option value="video">فيديوهات</option>
            <option value="image">صور</option>
            <option value="document">مستندات</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="published">منشور</option>
            <option value="draft">مسودة</option>
            <option value="archived">مؤرشف</option>
          </select>

          {/* Add Button */}
          <button 
            onClick={handleAddContent}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            إضافة محتوى
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-gray-900">{pagination.total}</div>
          <div className="text-sm text-gray-500 mt-1">إجمالي المحتوى</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">
            {content.filter(c => c.status === 'published').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">منشور</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-yellow-600">
            {content.filter(c => c.status === 'draft').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">مسودة</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-blue-600">
            {content.reduce((sum, c) => sum + (c.views || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">إجمالي المشاهدات</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {content.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl">
            {loading ? 'جاري التحميل...' : 'لا توجد نتائج'}
          </div>
        ) : (
          content.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              {/* Content Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${getTypeColor(item.type)} flex items-center justify-center`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(item.created_at).toLocaleDateString('ar-SA')}
                  </span>
                  {item.author && (
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {item.author}
                    </span>
                  )}
                </div>
              </div>

              {/* Content Footer */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Eye size={16} />
                    <span>{item.views || 0} مشاهدة</span>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getTypeColor(item.type)}`}>
                    {getTypeLabel(item.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePreview(item)}
                    className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-bold"
                  >
                    <Eye size={16} className="inline ml-1" />
                    معاينة
                  </button>
                  <button 
                    onClick={() => handleEditContent(item)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="تعديل"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteContent(item)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-600">
            عرض {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <div className="px-4 py-2 text-sm font-bold text-gray-700">
              صفحة {pagination.page} من {pagination.totalPages}
            </div>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false)
          setShowEditModal(false)
          setFormData({ 
            title: '', 
            description: '', 
            type: 'article', 
            category: '', 
            status: 'draft',
            author: ''
          })
          setSelectedItem(null)
          setError(null)
        }}
        title={selectedItem ? 'تعديل محتوى' : 'إضافة محتوى جديد'}
        size="lg"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="أدخل عنوان المحتوى"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="أدخل وصف المحتوى"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">النوع</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentItem['type'] })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="article">مقال</option>
                <option value="video">فيديو</option>
                <option value="image">صورة</option>
                <option value="document">مستند</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentItem['status'] })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الفئة</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="مثال: صحة، تعليم"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المؤلف</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="اسم المؤلف"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={saveContent}
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => {
                setShowAddModal(false)
                setShowEditModal(false)
                setFormData({ 
                  title: '', 
                  description: '', 
                  type: 'article', 
                  category: '', 
                  status: 'draft',
                  author: ''
                })
                setSelectedItem(null)
                setError(null)
              }}
              className="px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false)
          setSelectedItem(null)
        }}
        title={selectedItem?.title || 'معاينة المحتوى'}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(selectedItem.type)}`}>
                {getTypeLabel(selectedItem.type)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedItem.status)}`}>
                {getStatusLabel(selectedItem.status)}
              </span>
              {selectedItem.views !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {selectedItem.views} مشاهدة
                </span>
              )}
            </div>
            {selectedItem.description && (
              <p className="text-gray-700 leading-relaxed">{selectedItem.description}</p>
            )}
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              <div>تاريخ الإنشاء: {new Date(selectedItem.created_at).toLocaleDateString('ar-SA')}</div>
              {selectedItem.updated_at && (
                <div>آخر تحديث: {new Date(selectedItem.updated_at).toLocaleDateString('ar-SA')}</div>
              )}
              {selectedItem.author && (
                <div>المؤلف: {selectedItem.author}</div>
              )}
              {selectedItem.category && (
                <div>الفئة: {selectedItem.category}</div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedItem(null)
          setError(null)
        }}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <p className="text-gray-700">
            هل أنت متأكد من حذف المحتوى <strong>{selectedItem?.title}</strong>؟
            <br />
            <span className="text-sm text-gray-500">لا يمكن التراجع عن هذا الإجراء.</span>
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={confirmDelete}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {saving ? 'جاري الحذف...' : 'حذف'}
            </button>
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedItem(null)
                setError(null)
              }}
              className="px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
