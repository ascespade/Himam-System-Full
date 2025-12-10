'use client'

/**
 * Unified Flow Card Component
 * Reusable card component for displaying flows across all modules
 */

import { FC } from 'react'
import { Play, Pause, Edit, Trash2, GitBranch } from 'lucide-react'
import type { Flow } from './FlowTypes'

interface FlowCardProps {
  flow: Flow
  onToggle?: (flowId: string) => void
  onEdit?: (flow: Flow) => void
  onDelete?: (flowId: string) => void
  getCategoryIcon?: (category: string) => React.ReactNode
  getCategoryLabel?: (category: string) => string
  renderCustomContent?: (flow: Flow) => React.ReactNode
}

export const FlowCard: FC<FlowCardProps> = ({
  flow,
  onToggle,
  onEdit,
  onDelete,
  getCategoryIcon,
  getCategoryLabel,
  renderCustomContent,
}) => {
  const defaultCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      appointment: '📅',
      information: 'ℹ️',
      support: '🛟',
      booking: '📋',
      insurance: '🏥',
      billing: '💰',
      notification: '🔔',
      automation: '⚙️',
      custom: '🔧',
    }
    return icons[category] || '📌'
  }

  const defaultCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      appointment: 'إدارة المواعيد',
      information: 'معلومات',
      support: 'دعم',
      booking: 'حجز',
      insurance: 'تأمين',
      billing: 'الفواتير',
      notification: 'إشعارات',
      automation: 'أتمتة',
      custom: 'مخصص',
    }
    return labels[category] || category
  }

  const categoryIcon = getCategoryIcon?.(flow.category) || defaultCategoryIcon(flow.category)
  const categoryLabel = getCategoryLabel?.(flow.category) || defaultCategoryLabel(flow.category)

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 p-6 transition-all ${
        flow.is_active
          ? 'border-green-200 hover:border-green-300'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${
              flow.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {typeof categoryIcon === 'string' ? (
              <span className="text-2xl">{categoryIcon}</span>
            ) : (
              categoryIcon
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{flow.name}</h3>
            <p className="text-xs text-gray-500">{categoryLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggle && (
            <button
              onClick={() => onToggle(flow.id)}
              className={`p-2 rounded-lg transition-colors ${
                flow.is_active
                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={flow.is_active ? 'تعطيل' : 'تفعيل'}
            >
              {flow.is_active ? <Pause size={18} /> : <Play size={18} />}
            </button>
          )}
        </div>
      </div>

      {flow.description && (
        <p className="text-sm text-gray-600 mb-4">{flow.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <GitBranch size={14} />
          <span>نوع المشغل: {flow.trigger_type}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>الخطوات: {flow.steps?.length || 0}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>الأولوية: {flow.priority}</span>
        </div>
        {renderCustomContent && renderCustomContent(flow)}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={() => onEdit(flow)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Edit size={16} />
            تعديل
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(flow.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

