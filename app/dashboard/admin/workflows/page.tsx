'use client'

/**
 * General Workflows Management Page
 * Uses unified FlowList component with general workflow customizations
 */

import { useState } from 'react'
import { Plus, GitBranch } from 'lucide-react'
import { FlowList } from '@/shared/components/flows/FlowList'
import type { Flow } from '@/shared/components/flows/FlowTypes'

export default function WorkflowsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null)

  const handleEdit = (flow: Flow) => {
    setEditingFlow(flow)
    setShowCreateModal(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التدفقات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة تدفقات العمل والأتمتة</p>
        </div>
        <button
          onClick={() => {
            setEditingFlow(null)
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          تدفق جديد
        </button>
      </div>

      {/* Unified Flow List */}
      <FlowList
        module="general"
        apiEndpoint="/api/workflows"
        onCreateClick={() => setShowCreateModal(true)}
        onEdit={handleEdit}
        emptyStateMessage="لا توجد تدفقات"
      />

      {/* Create/Edit Modal - TODO: Extract to shared component */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingFlow ? 'تعديل التدفق' : 'إنشاء تدفق جديد'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingFlow(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500">
                سيتم إضافة نموذج إنشاء/تعديل التدفق هنا قريباً
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
