/**
 * Flow Modal Component
 * Reusable modal for creating and editing flows
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { toast } from 'sonner'

interface FlowModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  initialData?: Record<string, unknown> | null
  title: string
}

export function FlowModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}: FlowModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({
    name: '',
    description: '',
    module: 'whatsapp',
    is_active: true,
    ...initialData,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      toast.success('تم الحفظ بنجاح')
      onClose()
      setFormData({ name: '', description: '', module: 'whatsapp', is_active: true })
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to submit flow', error, { component: 'FlowModal', title })
      toast.error('فشل الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                الاسم *
              </label>
              <input
                type="text"
                required
                value={String(formData.name || '')}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="اسم التدفق"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                value={String(formData.description || '')}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="وصف التدفق"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                المديول
              </label>
              <select
                value={String(formData.module || 'whatsapp')}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="whatsapp">واتساب</option>
                <option value="workflow">سير العمل</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={Boolean(formData.is_active)}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                نشط
              </label>
            </div>

            <p className="text-sm text-gray-500">
              سيتم إضافة المزيد من الحقول قريباً (trigger, nodes, edges)
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
