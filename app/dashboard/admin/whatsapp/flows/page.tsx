'use client'

/**
 * WhatsApp Flows Management Page
 * Uses unified FlowList component with WhatsApp-specific customizations
 */

import { useState } from 'react'
import { Plus, Bot, Calendar, MessageSquare, Settings, Zap } from 'lucide-react'
import { FlowList } from '@/shared/components/flows/FlowList'
import type { Flow } from '@/shared/components/flows/FlowTypes'

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
              <span>نموذج AI: {whatsappFlow.ai_model}</span>
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
