'use client'

/**
 * Unified Flow List Component
 * Reusable list component for displaying flows with search and filters
 */

import { FC, useState, useEffect } from 'react'
import { Search, Plus, GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import type { Flow, FlowModule } from './FlowTypes'
import { FlowCard } from './FlowCard'

interface FlowListProps {
  module: FlowModule
  apiEndpoint: string
  onCreateClick?: () => void
  onEdit?: (flow: Flow) => void
  onDelete?: (flowId: string) => Promise<void>
  getCategoryIcon?: (category: string) => React.ReactNode
  getCategoryLabel?: (category: string) => string
  renderCustomContent?: (flow: Flow) => React.ReactNode
  emptyStateMessage?: string
}

export const FlowList: FC<FlowListProps> = ({
  module,
  apiEndpoint,
  onCreateClick,
  onEdit,
  onDelete,
  getCategoryIcon,
  getCategoryLabel,
  renderCustomContent,
  emptyStateMessage = 'لا توجد تدفقات بعد',
}) => {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFlows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiEndpoint])

  const fetchFlows = async () => {
    try {
      setLoading(true)
      const res = await fetch(apiEndpoint)
      const data = await res.json()
      if (data.success) {
        setFlows(data.data || [])
      } else {
        toast.error('فشل تحميل التدفقات: ' + (data.error || 'خطأ غير معروف'))
        setFlows([])
      }
    } catch (error) {
      console.error('Error fetching flows:', error)
      toast.error('حدث خطأ أثناء تحميل التدفقات')
      setFlows([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (flowId: string) => {
    try {
      const flow = flows.find(f => f.id === flowId)
      if (!flow) return

      const res = await fetch(`${apiEndpoint}/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !flow.is_active }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`تم ${flow.is_active ? 'تعطيل' : 'تفعيل'} التدفق بنجاح`)
        await fetchFlows()
      } else {
        toast.error('فشل تحديث التدفق: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error toggling flow:', error)
      toast.error('حدث خطأ أثناء تحديث التدفق')
    }
  }

  const handleDelete = async (flowId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التدفق؟')) return

    try {
      if (onDelete) {
        await onDelete(flowId)
      } else {
        const res = await fetch(`${apiEndpoint}/${flowId}`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (data.success) {
          toast.success('تم حذف التدفق بنجاح')
        } else {
          toast.error('فشل حذف التدفق: ' + (data.error || 'خطأ غير معروف'))
        }
      }
      await fetchFlows()
    } catch (error) {
      console.error('Error deleting flow:', error)
      toast.error('حدث خطأ أثناء حذف التدفق')
    }
  }

  const filteredFlows = flows.filter(flow => {
    return flow.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           flow.description?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل التدفقات...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن تدفق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي التدفقات</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{flows.length}</p>
            </div>
            <GitBranch className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">نشطة</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {flows.filter(f => f.is_active).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">متوقفة</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">
                {flows.filter(f => !f.is_active).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Flows Grid */}
      {filteredFlows.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <GitBranch className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">{emptyStateMessage}</p>
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="mt-4 text-primary font-medium hover:underline"
            >
              إنشاء تدفق جديد
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onToggle={handleToggle}
              onEdit={onEdit}
              onDelete={handleDelete}
              getCategoryIcon={getCategoryIcon}
              getCategoryLabel={getCategoryLabel}
              renderCustomContent={renderCustomContent}
            />
          ))}
        </div>
      )}
    </div>
  )
}

