'use client'

import { useState, useEffect, useCallback } from 'react'
import { BrainCircuit, Plus, Edit, Trash2, Search, BookOpen, FileText, MessageSquare, Database, X, Save, Calendar, ChevronRight, ChevronLeft, Eye, Tag } from 'lucide-react'
import Modal from '@/components/Modal'

interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: 'faq' | 'article' | 'training' | 'policy'
  tags: string[]
  created_at: string
  updated_at?: string
  views?: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null)
  const [formData, setFormData] = useState({ 
    title: '', 
    content: '', 
    category: 'faq' as KnowledgeItem['category'], 
    tags: [] as string[],
    tagInput: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchKnowledge = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm })
      })
      
      const res = await fetch(`/api/knowledge?${params}`)
      const data = await res.json()
      if (data.success) {
        setKnowledge(data.data || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else {
        // If table doesn't exist, show empty state
        setKnowledge([])
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 })
      }
    } catch (error) {
      console.error('Error fetching knowledge:', error)
      setKnowledge([])
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, selectedCategory, searchTerm])

  useEffect(() => {
    fetchKnowledge()
  }, [fetchKnowledge])

  const handleAddKnowledge = () => {
    setFormData({ 
      title: '', 
      content: '', 
      category: 'faq', 
      tags: [],
      tagInput: ''
    })
    setShowAddModal(true)
  }

  const handleEditKnowledge = (item: KnowledgeItem) => {
    setSelectedItem(item)
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags || [],
      tagInput: ''
    })
    setShowEditModal(true)
  }

  const handleDeleteKnowledge = (item: KnowledgeItem) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const handlePreview = (item: KnowledgeItem) => {
    setSelectedItem(item)
    setShowPreviewModal(true)
  }

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: ''
      })
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  const saveKnowledge = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (!formData.title || !formData.content || !formData.category) {
        setError('جميع الحقول مطلوبة')
        return
      }

      const url = selectedItem ? `/api/knowledge/${selectedItem.id}` : '/api/knowledge'
      const method = selectedItem ? 'PUT' : 'POST'
      const body = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags
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
          content: '', 
          category: 'faq', 
          tags: [],
          tagInput: ''
        })
        setSelectedItem(null)
        setTimeout(() => {
          fetchKnowledge()
          setSuccess(null)
        }, 1000)
      } else {
        setError(data.error || 'فشل الحفظ')
      }
    } catch (error) {
      console.error('Error saving knowledge:', error)
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
      const res = await fetch(`/api/knowledge/${selectedItem.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        setSuccess('تم حذف المحتوى بنجاح')
        setShowDeleteModal(false)
        setSelectedItem(null)
        setTimeout(() => {
          fetchKnowledge()
          setSuccess(null)
        }, 1000)
      } else {
        setError(data.error || 'فشل الحذف')
      }
    } catch (error) {
      console.error('Error deleting knowledge:', error)
      setError('حدث خطأ في الحذف')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'faq': return <MessageSquare size={20} />
      case 'article': return <FileText size={20} />
      case 'training': return <BookOpen size={20} />
      case 'policy': return <Database size={20} />
      default: return <FileText size={20} />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'faq': return 'bg-blue-100 text-blue-700'
      case 'article': return 'bg-green-100 text-green-700'
      case 'training': return 'bg-purple-100 text-purple-700'
      case 'policy': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'faq': return 'أسئلة شائعة'
      case 'article': return 'مقالات'
      case 'training': return 'تدريب'
      case 'policy': return 'سياسات'
      default: return category
    }
  }

  if (loading && knowledge.length === 0) {
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
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">قاعدة المعرفة</h1>
        <p className="text-gray-500 text-lg">إدارة المحتوى التعليمي والتدريبي والموارد المعرفية</p>
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
                placeholder="ابحث في قاعدة المعرفة..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الفئات</option>
            <option value="faq">أسئلة شائعة</option>
            <option value="article">مقالات</option>
            <option value="training">تدريب</option>
            <option value="policy">سياسات</option>
          </select>

          {/* Add Button */}
          <button 
            onClick={handleAddKnowledge}
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
          <div className="text-3xl font-bold text-blue-600">{knowledge.filter(k => k.category === 'faq').length}</div>
          <div className="text-sm text-gray-500 mt-1">أسئلة شائعة</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">{knowledge.filter(k => k.category === 'article').length}</div>
          <div className="text-sm text-gray-500 mt-1">مقالات</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-purple-600">{knowledge.filter(k => k.category === 'training').length}</div>
          <div className="text-sm text-gray-500 mt-1">مواد تدريبية</div>
        </div>
      </div>

      {/* Knowledge List */}
      <div className="space-y-4 mb-6">
        {knowledge.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <BrainCircuit className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-lg">لا توجد نتائج</p>
            <p className="text-gray-400 text-sm mt-2">ابدأ بإضافة محتوى جديد إلى قاعدة المعرفة</p>
          </div>
        ) : (
          knowledge.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-4">
                {/* Category Icon */}
                <div className={`w-14 h-14 rounded-xl ${getCategoryColor(item.category)} flex items-center justify-center flex-shrink-0`}>
                  {getCategoryIcon(item.category)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(item.category)}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                        {item.views !== undefined && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Eye size={14} />
                            {item.views} مشاهدة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {item.content}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg flex items-center gap-1">
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        تم الإنشاء: {new Date(item.created_at).toLocaleDateString('ar-SA')}
                      </span>
                      {item.updated_at && (
                        <span className="flex items-center gap-1">
                          تم التحديث: {new Date(item.updated_at).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePreview(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="معاينة"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleEditKnowledge(item)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteKnowledge(item)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
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
            content: '', 
            category: 'faq', 
            tags: [],
            tagInput: ''
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
            <label className="block text-sm font-bold text-gray-700 mb-2">المحتوى</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="أدخل محتوى المقال أو السؤال..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الفئة</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as KnowledgeItem['category'] })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="faq">أسئلة شائعة</option>
              <option value="article">مقالات</option>
              <option value="training">تدريب</option>
              <option value="policy">سياسات</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">العلامات (Tags)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formData.tagInput}
                onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="أدخل علامة واضغط Enter"
              />
              <button
                onClick={addTag}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors"
              >
                إضافة
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-bold flex items-center gap-2">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={saveKnowledge}
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
                  content: '', 
                  category: 'faq', 
                  tags: [],
                  tagInput: ''
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
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(selectedItem.category)}`}>
                {getCategoryLabel(selectedItem.category)}
              </span>
              {selectedItem.views !== undefined && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Eye size={14} />
                  {selectedItem.views} مشاهدة
                </span>
              )}
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedItem.content}</p>
            </div>
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {selectedItem.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg flex items-center gap-1">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              <div>تاريخ الإنشاء: {new Date(selectedItem.created_at).toLocaleDateString('ar-SA')}</div>
              {selectedItem.updated_at && (
                <div>آخر تحديث: {new Date(selectedItem.updated_at).toLocaleDateString('ar-SA')}</div>
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
