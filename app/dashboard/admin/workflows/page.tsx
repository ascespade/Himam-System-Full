'use client'

import { GitBranch, Plus, Play, Pause, Trash2, Edit, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Workflow {
  id: string
  name: string
  description?: string
  trigger_type: string
  is_active: boolean
  steps: any[]
  created_at: string
  updated_at?: string
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/workflows')
      const data = await response.json()
      
      if (data.success) {
        setWorkflows(data.data || [])
      } else {
        console.error('Error fetching workflows:', data.error)
        setWorkflows([])
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (workflowId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(currentStatus ? 'تم إيقاف التدفق' : 'تم تفعيل التدفق')
        await fetchWorkflows()
      } else {
        toast.error('فشل تحديث التدفق: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
      toast.error('حدث خطأ أثناء تحديث التدفق')
    }
  }

  const handleDelete = async (workflowId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التدفق؟')) return
    
    try {
      const response = await fetch(`/api/admin/workflows/${workflowId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        toast.success('تم حذف التدفق بنجاح')
        await fetchWorkflows()
      } else {
        toast.error('فشل حذف التدفق: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      toast.error('حدث خطأ أثناء حذف التدفق')
    }
  }

  const filteredWorkflows = workflows.filter(workflow => {
    return workflow.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التدفقات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة تدفقات العمل والأتمتة</p>
        </div>
        <button 
          onClick={() => toast.info('سيتم إضافة نافذة إنشاء التدفق قريباً')}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          تدفق جديد
        </button>
      </div>

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
              <p className="text-2xl font-bold text-gray-900 mt-1">{workflows.length}</p>
            </div>
            <GitBranch className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">نشطة</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {workflows.filter(w => w.is_active).length}
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
                {workflows.filter(w => !w.is_active).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <GitBranch className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد تدفقات</p>
          <p className="text-sm text-gray-400 mt-2">ابدأ بإنشاء تدفق جديد للأتمتة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <GitBranch className="text-primary" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                    {workflow.description && (
                      <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-400">
                        نوع: {workflow.trigger_type || 'غير محدد'}
                      </span>
                      <span className="text-xs text-gray-400">
                        خطوات: {workflow.steps?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  workflow.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {workflow.is_active ? 'نشط' : 'متوقف'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      workflow.is_active
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={workflow.is_active ? 'إيقاف' : 'تفعيل'}
                  >
                    {workflow.is_active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button 
                    onClick={() => toast.info(`تعديل التدفق: ${workflow.name}`)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg"
                    title="تعديل"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(workflow.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(workflow.created_at).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
