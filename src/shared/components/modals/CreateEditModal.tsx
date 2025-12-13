/**
 * Create/Edit Modal Component
 * Reusable modal for creating and editing entities
 */

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface CreateEditModalProps<T> {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: T) => Promise<void>
  initialData?: Partial<T>
  title: string
  children: React.ReactNode
  submitLabel?: string
  cancelLabel?: string
}

export function CreateEditModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  children,
  submitLabel = 'حفظ',
  cancelLabel = 'إلغاء',
}: CreateEditModalProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const data = Object.fromEntries(formData.entries()) as T
      
      // Merge with initial data
      const finalData = { ...initialData, ...data } as T
      
      await onSubmit(finalData)
      toast.success('تم الحفظ بنجاح')
      onClose()
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to submit form', error, { component: 'CreateEditModal', title })
      toast.error('فشل الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
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
          <div className="p-6">
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحفظ...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
