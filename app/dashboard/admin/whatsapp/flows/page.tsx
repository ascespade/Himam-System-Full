'use client'

/**
 * WhatsApp Flows Management Page
 * Uses unified FlowList component with WhatsApp-specific customizations
 */

import { useState } from 'react'
import { Plus, Bot, Calendar, MessageSquare, Settings, Zap } from 'lucide-react'
import { FlowList } from '@/shared/components/flows/FlowList'
import type { Flow } from '@/shared/components/flows/FlowTypes'
import { FlowModal } from '@/shared/components/modals/FlowModal'

export default function WhatsAppFlowsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appointment':
        return <Calendar size={20} />
      case 'information':
        return <MessageSquare size={20} />
      case 'support':
        return <Settings size={20} />
      default:
        return <Zap size={20} />
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      appointment: 'إدارة المواعيد',
      information: 'معلومات',
      support: 'دعم',
      booking: 'حجز',
      custom: 'مخصص',
    }
    return labels[category] || category
  }

  const renderCustomContent = (flow: Flow) => {
    if (flow.module === 'whatsapp') {
      const whatsappFlow = flow as unknown as Record<string, unknown>
      return (
        <>
          {whatsappFlow.ai_model && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Bot size={14} />
              <span>نموذج AI: {String(whatsappFlow.ai_model || '')}</span>
            </div>
          )}
          {Array.isArray(whatsappFlow.appointment_actions) && whatsappFlow.appointment_actions.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={14} />
              <span>إجراءات: {(whatsappFlow.appointment_actions as string[]).join(', ')}</span>
            </div>
          )}
        </>
      )
    }
    return null
  }

  const handleEdit = (flow: Flow) => {
    setEditingFlow(flow)
    setShowCreateModal(true)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
            <Bot size={40} className="text-primary" />
            إدارة تدفقات الواتساب
          </h1>
          <p className="text-gray-500 text-lg">إدارة التدفقات الآلية للرد على رسائل الواتساب</p>
        </div>
        <button
          onClick={() => {
            setEditingFlow(null)
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-bold"
        >
          <Plus size={20} />
          إنشاء تدفق جديد
        </button>
      </div>

      {/* Unified Flow List */}
      <FlowList
        module="whatsapp"
        apiEndpoint="/api/whatsapp/flows"
        onCreateClick={() => setShowCreateModal(true)}
        onEdit={handleEdit}
        getCategoryIcon={getCategoryIcon}
        getCategoryLabel={getCategoryLabel}
        renderCustomContent={renderCustomContent}
        emptyStateMessage="لا توجد تدفقات واتساب بعد"
      />

      {/* Create/Edit Modal */}
      <FlowModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingFlow(null)
        }}
        onSubmit={async (data) => {
          const url = editingFlow ? `/api/whatsapp/flows/${editingFlow.id}` : '/api/whatsapp/flows'
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
          
          // Refresh flows list
          window.location.reload()
        }}
        initialData={editingFlow ? (editingFlow as unknown as Record<string, unknown>) : undefined}
        title={editingFlow ? 'تعديل التدفق' : 'إنشاء تدفق جديد'}
      />
    </div>
  )
}
