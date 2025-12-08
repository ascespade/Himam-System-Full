'use client'

/**
 * Workflow Management UI
 * واجهة إدارة التدفقات (Workflows)
 * تسمح للمدير بإنشاء وتعديل التدفقات بدون كود
 */

import { useEffect, useState } from 'react'
import { Plus, Play, Pause, Trash2, Edit, Save, X } from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string
  category: string
  trigger_type: string
  trigger_config: any
  steps: any[]
  ai_model: string
  is_active: boolean
  version: number
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadWorkflows()
  }, [selectedCategory])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      const res = await fetch(`/api/workflows?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setWorkflows(data.data || [])
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      })
      const data = await res.json()
      if (data.success) {
        await loadWorkflows()
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const categories = [...new Set(workflows.map(w => w.category))]

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل التدفقات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة التدفقات</h1>
        <p className="text-gray-500 text-lg">إنشاء وتعديل التدفقات المؤتمتة</p>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">الفئات</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            تدفق جديد
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الكل
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">لا توجد تدفقات</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{workflow.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {getCategoryLabel(workflow.category)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      workflow.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {workflow.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-gray-500 mb-2">{workflow.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>النوع: {workflow.trigger_type}</span>
                    <span>AI Model: {workflow.ai_model}</span>
                    <span>الإصدار: {workflow.version}</span>
                    <span>الخطوات: {workflow.steps?.length || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      workflow.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={workflow.is_active ? 'تعطيل' : 'تفعيل'}
                  >
                    {workflow.is_active ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="تعديل"
                  >
                    <Edit size={18} />
                  </button>
                </div>
              </div>
              {/* Steps Preview */}
              {workflow.steps && workflow.steps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">الخطوات:</h4>
                  <div className="space-y-2">
                    {workflow.steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span>{step.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    insurance: 'التأمين',
    whatsapp: 'الواتساب',
    appointment: 'المواعيد',
    patient: 'المريض',
    doctor: 'الطبيب'
  }
  return labels[category] || category
}

