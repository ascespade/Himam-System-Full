'use client'

/**
 * Dynamic Workflows Management Page
 * صفحة إدارة التدفقات الديناميكية
 * تسمح بإنشاء وتعديل التدفقات بدون كود
 */

import { useEffect, useState } from 'react'
import { 
  Plus, Play, Pause, Trash2, Edit, Save, X, 
  Zap, MessageSquare, Shield, Calendar, User, 
  Bot, ArrowRight, Settings, Copy, Eye,
  CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react'
// // import { toast } from 'sonner' // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
} // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}

interface WorkflowStep {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'ai_agent' | 'notification' | 'webhook' | 'delay'
  name: string
  config: Record<string, any>
  order: number
}

interface Workflow {
  id?: string
  name: string
  description?: string
  category: 'whatsapp' | 'insurance' | 'appointment' | 'patient' | 'doctor' | 'billing' | 'custom'
  trigger_type: 'webhook' | 'schedule' | 'event' | 'manual' | 'message'
  trigger_config: Record<string, any>
  steps: WorkflowStep[]
  ai_model?: string
  is_active: boolean
  priority: number
  version: number
  created_at?: string
  updated_at?: string
}

const STEP_TYPES = {
  trigger: { label: 'مشغل', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  condition: { label: 'شرط', icon: AlertCircle, color: 'bg-blue-100 text-blue-700' },
  action: { label: 'إجراء', icon: ArrowRight, color: 'bg-green-100 text-green-700' },
  ai_agent: { label: 'وكيل ذكي', icon: Bot, color: 'bg-purple-100 text-purple-700' },
  notification: { label: 'إشعار', icon: MessageSquare, color: 'bg-orange-100 text-orange-700' },
  webhook: { label: 'Webhook', icon: Settings, color: 'bg-gray-100 text-gray-700' },
  delay: { label: 'تأخير', icon: Clock, color: 'bg-indigo-100 text-indigo-700' }
}

const CATEGORIES = {
  whatsapp: { label: 'الواتساب', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  insurance: { label: 'التأمين', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  appointment: { label: 'المواعيد', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
  patient: { label: 'المريض', icon: User, color: 'bg-pink-100 text-pink-700' },
  doctor: { label: 'الطبيب', icon: User, color: 'bg-cyan-100 text-cyan-700' },
  billing: { label: 'الفواتير', icon: Save, color: 'bg-yellow-100 text-yellow-700' },
  custom: { label: 'مخصص', icon: Settings, color: 'bg-gray-100 text-gray-700' }
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showStepBuilder, setShowStepBuilder] = useState(false)
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null)

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
      const res = await fetch(`/api/admin/workflows?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setWorkflows(data.data || [])
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
      toast.error('فشل تحميل التدفقات')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (workflow: Workflow) => {
    try {
      const url = workflow.id ? `/api/admin/workflows/${workflow.id}` : '/api/admin/workflows'
      const method = workflow.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(workflow.id ? 'تم تحديث التدفق' : 'تم إنشاء التدفق')
        setShowForm(false)
        setEditingWorkflow(null)
        loadWorkflows()
      } else {
        toast.error(data.error || 'فشل الحفظ')
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      toast.error('حدث خطأ أثناء الحفظ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التدفق؟')) return

    try {
      const res = await fetch(`/api/admin/workflows/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('تم حذف التدفق')
        loadWorkflows()
      } else {
        toast.error(data.error || 'فشل الحذف')
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const toggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(isActive ? 'تم تعطيل التدفق' : 'تم تفعيل التدفق')
        loadWorkflows()
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
      toast.error('حدث خطأ')
    }
  }

  const duplicateWorkflow = async (workflow: Workflow) => {
    const duplicated: Workflow = {
      ...workflow,
      id: undefined,
      name: `${workflow.name} (نسخة)`,
      is_active: false,
      version: 1
    }
    setEditingWorkflow(duplicated)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const categories = [...new Set(workflows.map(w => w.category))]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة التدفقات</h1>
          <p className="text-gray-500 text-lg">إنشاء وتعديل التدفقات المؤتمتة بدون كود</p>
        </div>
        <button
          onClick={() => {
            setEditingWorkflow(null)
            setShowForm(true)
          }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          تدفق جديد
        </button>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الكل ({workflows.length})
          </button>
          {categories.map(category => {
            const catInfo = CATEGORIES[category as keyof typeof CATEGORIES]
            const count = workflows.filter(w => w.category === category).length
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {catInfo && <catInfo.icon size={16} />}
                {catInfo?.label || category} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.filter(w => selectedCategory === 'all' || w.category === selectedCategory).map((workflow) => {
          const catInfo = CATEGORIES[workflow.category as keyof typeof CATEGORIES]
          return (
            <div
              key={workflow.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{workflow.name}</h3>
                    {catInfo && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${catInfo.color}`}>
                        <catInfo.icon size={14} />
                        {catInfo.label}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      workflow.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {workflow.is_active ? 'نشط' : 'معطل'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      أولوية: {workflow.priority}
                    </span>
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-gray-500 mb-2">{workflow.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>المشغل: {workflow.trigger_type}</span>
                    {workflow.ai_model && <span>AI: {workflow.ai_model}</span>}
                    <span>الإصدار: {workflow.version}</span>
                    <span>الخطوات: {workflow.steps?.length || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleWorkflow(workflow.id!, workflow.is_active)}
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
                    onClick={() => duplicateWorkflow(workflow)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="نسخ"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingWorkflow(workflow)
                      setShowForm(true)
                    }}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="تعديل"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id!)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Steps Preview */}
              {workflow.steps && workflow.steps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">خطوات التدفق:</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {workflow.steps
                      .sort((a, b) => a.order - b.order)
                      .map((step, idx) => {
                        const stepInfo = STEP_TYPES[step.type as keyof typeof STEP_TYPES]
                        return (
                          <div key={step.id || idx} className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              stepInfo?.color || 'bg-gray-100 text-gray-700'
                            }`}>
                              {stepInfo && <stepInfo.icon size={12} />}
                              {stepInfo?.label || step.type}: {step.name}
                            </div>
                            {idx < workflow.steps.length - 1 && (
                              <ArrowRight size={14} className="text-gray-400" />
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {workflows.filter(w => selectedCategory === 'all' || w.category === selectedCategory).length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Zap className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد تدفقات</h3>
            <p className="text-gray-500 mb-6">ابدأ بإنشاء تدفق جديد</p>
            <button
              onClick={() => {
                setEditingWorkflow(null)
                setShowForm(true)
              }}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              إنشاء تدفق جديد
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <WorkflowForm
          workflow={editingWorkflow}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingWorkflow(null)
          }}
          onAddStep={() => setShowStepBuilder(true)}
        />
      )}

      {/* Step Builder Modal */}
      {showStepBuilder && (
        <StepBuilder
          step={currentStep}
          onSave={(step) => {
            // Add step to workflow
            if (editingWorkflow) {
              const updated = {
                ...editingWorkflow,
                steps: [...(editingWorkflow.steps || []), { ...step, order: editingWorkflow.steps.length }]
              }
              setEditingWorkflow(updated)
            }
            setShowStepBuilder(false)
            setCurrentStep(null)
          }}
          onCancel={() => {
            setShowStepBuilder(false)
            setCurrentStep(null)
          }}
        />
      )}
    </div>
  )
}

function WorkflowForm({
  workflow,
  onSave,
  onCancel,
  onAddStep
}: {
  workflow: Workflow | null
  onSave: (workflow: Workflow) => void
  onCancel: () => void
  onAddStep: () => void
}) {
  const [formData, setFormData] = useState<Partial<Workflow>>({
    name: workflow?.name || '',
    description: workflow?.description || '',
    category: workflow?.category || 'custom',
    trigger_type: workflow?.trigger_type || 'webhook',
    trigger_config: workflow?.trigger_config || {},
    steps: workflow?.steps || [],
    ai_model: workflow?.ai_model || 'gpt-4',
    is_active: workflow?.is_active !== undefined ? workflow.is_active : true,
    priority: workflow?.priority || 0,
    version: workflow?.version || 1
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: workflow?.id,
      name: formData.name || '',
      description: formData.description,
      category: formData.category || 'custom',
      trigger_type: formData.trigger_type || 'webhook',
      trigger_config: formData.trigger_config || {},
      steps: formData.steps || [],
      ai_model: formData.ai_model,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      priority: formData.priority || 0,
      version: formData.version || 1,
      created_at: workflow?.created_at,
      updated_at: new Date().toISOString()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {workflow ? 'تعديل التدفق' : 'إنشاء تدفق جديد'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم التدفق *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="مثال: إشعار موعد جديد"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الفئة *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {Object.entries(CATEGORIES).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="وصف التدفق..."
            />
          </div>

          {/* Trigger */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">المشغل (Trigger)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع المشغل *</label>
                <select
                  required
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="webhook">Webhook</option>
                  <option value="schedule">جدولة</option>
                  <option value="event">حدث</option>
                  <option value="message">رسالة</option>
                  <option value="manual">يدوي</option>
                </select>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">الخطوات</h3>
              <button
                type="button"
                onClick={onAddStep}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
              >
                <Plus size={18} />
                إضافة خطوة
              </button>
            </div>
            <div className="space-y-2">
              {formData.steps && formData.steps.length > 0 ? (
                formData.steps.map((step, idx) => {
                  const stepInfo = STEP_TYPES[step.type as keyof typeof STEP_TYPES]
                  return (
                    <div key={step.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {stepInfo && <stepInfo.icon size={16} className={stepInfo.color} />}
                          <span className="font-bold text-gray-900">{step.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${stepInfo?.color || 'bg-gray-100'}`}>
                            {stepInfo?.label || step.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لا توجد خطوات. أضف خطوة لبدء التدفق.
                </div>
              )}
            </div>
          </div>

          {/* Advanced */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الأولوية</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">AI Model</label>
              <select
                value={formData.ai_model}
                onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
              <select
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="true">نشط</option>
                <option value="false">معطل</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              حفظ
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StepBuilder({
  step,
  onSave,
  onCancel
}: {
  step: WorkflowStep | null
  onSave: (step: WorkflowStep) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<WorkflowStep>>({
    type: step?.type || 'action',
    name: step?.name || '',
    config: step?.config || {}
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: step?.id || `step-${Date.now()}`,
      type: formData.type || 'action',
      name: formData.name || '',
      config: formData.config || {},
      order: step?.order || 0
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">إضافة خطوة</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">نوع الخطوة *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {Object.entries(STEP_TYPES).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم الخطوة *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="مثال: إرسال رسالة واتساب"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              إضافة
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
