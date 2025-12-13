'use client'

/**
 * General Workflows Management Page
 * Uses unified FlowList component with general workflow customizations
 */

import { useState } from 'react'
import { Plus, GitBranch } from 'lucide-react'
import { FlowList } from '@/shared/components/flows/FlowList'
import type { Flow } from '@/shared/components/flows/FlowTypes'
import { FlowModal } from '@/shared/components/modals/FlowModal'

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

      {/* Create/Edit Modal */}
      <FlowModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingFlow(null)
        }}
        onSubmit={async (data: Record<string, unknown>) => {
          const url = editingFlow ? `/api/workflows/${editingFlow.id}` : '/api/workflows'
          const method = editingFlow ? 'PUT' : 'POST'
          
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          
          const result = await res.json()
          if (!result.success) {
            throw new Error(result.error || 'فشل الحفظ')
          }
          
          // Refresh workflows list
          window.location.reload()
        }}
        initialData={editingFlow ? (editingFlow as unknown as Record<string, unknown>) : undefined}
        title={editingFlow ? 'تعديل التدفق' : 'إنشاء تدفق جديد'}
      />
    </div>
  )
}
