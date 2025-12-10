'use client'

/**
 * Universal Flows Management Page
 * Visual Flow Builder - No Code Required
 */

import { useEffect, useState, useCallback } from 'react'
import { Plus, Play, Pause, Edit, Trash2, Save, X, Zap, Copy, Filter, Search, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

interface Flow {
  id: string
  name: string
  description?: string
  module: string
  category: string
  trigger_type: string
  nodes: any[]
  edges: any[]
  is_active: boolean
  priority: number
  execution_count: number
  created_at: string
  updated_at: string
}

export default function FlowsPage() {
  const router = useRouter()
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterModule, setFilterModule] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchFlows()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('flows_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flows',
        },
        () => {
          fetchFlows()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchFlows = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterModule !== 'all') params.append('module', filterModule)
      if (filterCategory !== 'all') params.append('category', filterCategory)

      const res = await fetch(`/api/flows?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setFlows(data.data)
      } else {
        toast.error('فشل تحميل التدفقات: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error fetching flows:', error)
      toast.error('حدث خطأ أثناء تحميل التدفقات')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (flow: Flow) => {
    try {
      const res = await fetch(`/api/flows/${flow.id}`, {
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
    } catch (error: any) {
      console.error('Error toggling flow:', error)
      toast.error('حدث خطأ أثناء تحديث التدفق')
    }
  }

  const handleDelete = async (flowId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التدفق؟')) return

    try {
      const res = await fetch(`/api/flows/${flowId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف التدفق بنجاح')
        await fetchFlows()
      } else {
        toast.error('فشل حذف التدفق: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error: any) {
      console.error('Error deleting flow:', error)
      toast.error('حدث خطأ أثناء حذف التدفق')
    }
  }

  const handleDuplicate = async (flow: Flow) => {
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flow,
          name: `${flow.name} (نسخة)`,
          is_active: false,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم نسخ التدفق بنجاح')
        await fetchFlows()
      } else {
        toast.error('فشل نسخ التدفق: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error: any) {
      console.error('Error duplicating flow:', error)
      toast.error('حدث خطأ أثناء نسخ التدفق')
    }
  }

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      whatsapp: 'واتساب',
      appointments: 'المواعيد',
      patients: 'المرضى',
      billing: 'الفواتير',
      custom: 'مخصص',
    }
    return labels[module] || module
  }

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      webhook: 'Webhook',
      event: 'حدث',
      schedule: 'جدولة',
      condition: 'شرط',
      manual: 'يدوي',
      api_call: 'استدعاء API',
      database_change: 'تغيير قاعدة البيانات',
      user_action: 'إجراء مستخدم',
      ai_detection: 'كشف AI',
      time_based: 'وقت محدد',
    }
    return labels[trigger] || trigger
  }

  const filteredFlows = flows.filter(flow => {
    const matchesSearch = !searchTerm || 
      flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل التدفقات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
            <Layers size={40} className="text-primary" />
            نظام التدفقات الديناميكي
          </h1>
          <p className="text-gray-500 text-lg">إنشاء وإدارة التدفقات الآلية لأي جزء من النظام - بدون كود</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/flows/builder')}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-bold"
        >
          <Plus size={20} />
          إنشاء تدفق جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="بحث في التدفقات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={filterModule}
            onChange={(e) => {
              setFilterModule(e.target.value)
              fetchFlows()
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الوحدات</option>
            <option value="whatsapp">واتساب</option>
            <option value="appointments">المواعيد</option>
            <option value="patients">المرضى</option>
            <option value="billing">الفواتير</option>
            <option value="custom">مخصص</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              fetchFlows()
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الفئات</option>
            <option value="automation">أتمتة</option>
            <option value="notification">إشعارات</option>
            <option value="integration">تكامل</option>
            <option value="workflow">سير عمل</option>
          </select>
          <button
            onClick={fetchFlows}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter size={18} />
            تصفية
          </button>
        </div>
      </div>

      {/* Flows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFlows.map((flow) => (
          <div
            key={flow.id}
            className={`bg-white rounded-2xl shadow-sm border-2 p-6 transition-all ${
              flow.is_active
                ? 'border-green-200 hover:border-green-300'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{flow.name}</h3>
                  {flow.is_active && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                      نشط
                    </span>
                  )}
                </div>
                {flow.description && (
                  <p className="text-sm text-gray-600 mb-2">{flow.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {getModuleLabel(flow.module)}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    {getTriggerLabel(flow.trigger_type)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleActive(flow)}
                  className={`p-2 rounded-lg transition-colors ${
                    flow.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={flow.is_active ? 'تعطيل' : 'تفعيل'}
                >
                  {flow.is_active ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>عدد العقد:</span>
                <span className="font-bold">{flow.nodes?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>عدد التنفيذات:</span>
                <span className="font-bold">{flow.execution_count || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>الأولوية:</span>
                <span className="font-bold">{flow.priority}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => router.push(`/dashboard/admin/flows/builder?id=${flow.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <Edit size={16} />
                تعديل
              </button>
              <button
                onClick={() => handleDuplicate(flow)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                title="نسخ"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => handleDelete(flow.id)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFlows.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Layers size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد تدفقات بعد'}
          </p>
          <button
            onClick={() => router.push('/dashboard/admin/flows/builder')}
            className="text-primary font-medium hover:underline"
          >
            إنشاء تدفق جديد
          </button>
        </div>
      )}
    </div>
  )
}
