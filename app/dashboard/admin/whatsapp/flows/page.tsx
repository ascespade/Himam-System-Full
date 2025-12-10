'use client'

/**
 * WhatsApp Flows Management Page
 * Admin interface to manage WhatsApp AI flows
 */

import { useEffect, useState } from 'react'
import { Plus, Play, Pause, Edit, Trash2, Save, X, Bot, Zap, Calendar, MessageSquare, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'

interface Flow {
  id: string
  name: string
  description?: string
  category: 'appointment' | 'information' | 'support' | 'booking' | 'custom'
  trigger_type: 'keyword' | 'intent' | 'message_pattern' | 'manual'
  trigger_config: {
    keywords?: string[]
    intents?: string[]
    patterns?: string[]
  }
  steps: Array<{
    step: number
    name: string
    type: string
    description: string
  }>
  appointment_actions: string[]
  ai_model: string
  system_prompt?: string
  response_template?: string
  is_active: boolean
  priority: number
  version: number
  created_at: string
  updated_at: string
}

export default function WhatsAppFlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null)
  const [formData, setFormData] = useState<Partial<Flow>>({
    name: '',
    description: '',
    category: 'appointment',
    trigger_type: 'intent',
    trigger_config: { keywords: [], intents: [] },
    steps: [],
    appointment_actions: [],
    ai_model: 'gemini-2.0-flash',
    is_active: true,
    priority: 0,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchFlows()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('whatsapp_flows_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_flows',
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
      const res = await fetch('/api/whatsapp/flows')
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

  const handleSave = async () => {
    try {
      if (editingFlow) {
        // Update
        const res = await fetch(`/api/whatsapp/flows/${editingFlow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.success) {
          toast.success('تم تحديث التدفق بنجاح')
          setShowCreateModal(false)
          setEditingFlow(null)
          setFormData({
            name: '',
            description: '',
            category: 'appointment',
            trigger_type: 'intent',
            trigger_config: { keywords: [], intents: [] },
            steps: [],
            appointment_actions: [],
            ai_model: 'gemini-2.0-flash',
            is_active: true,
            priority: 0,
          })
          await fetchFlows()
        } else {
          toast.error('فشل تحديث التدفق: ' + (data.error || 'خطأ غير معروف'))
        }
      } else {
        // Create
        const res = await fetch('/api/whatsapp/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (data.success) {
          toast.success('تم إنشاء التدفق بنجاح')
          setShowCreateModal(false)
          setFormData({
            name: '',
            description: '',
            category: 'appointment',
            trigger_type: 'intent',
            trigger_config: { keywords: [], intents: [] },
            steps: [],
            appointment_actions: [],
            ai_model: 'gemini-2.0-flash',
            is_active: true,
            priority: 0,
          })
          await fetchFlows()
        } else {
          toast.error('فشل إنشاء التدفق: ' + (data.error || 'خطأ غير معروف'))
        }
      }
    } catch (error: any) {
      console.error('Error saving flow:', error)
      toast.error('حدث خطأ أثناء حفظ التدفق: ' + error.message)
    }
  }

  const handleToggleActive = async (flow: Flow) => {
    try {
      const res = await fetch(`/api/whatsapp/flows/${flow.id}`, {
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
      const res = await fetch(`/api/whatsapp/flows/${flowId}`, {
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

  const handleEdit = (flow: Flow) => {
    setEditingFlow(flow)
    setFormData({
      name: flow.name,
      description: flow.description,
      category: flow.category,
      trigger_type: flow.trigger_type,
      trigger_config: flow.trigger_config,
      steps: flow.steps,
      appointment_actions: flow.appointment_actions,
      ai_model: flow.ai_model,
      system_prompt: flow.system_prompt,
      response_template: flow.response_template,
      is_active: flow.is_active,
      priority: flow.priority,
    })
    setShowCreateModal(true)
  }

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
            <Bot size={40} className="text-primary" />
            إدارة تدفقات الواتساب
          </h1>
          <p className="text-gray-500 text-lg">إدارة التدفقات الآلية للرد على رسائل الواتساب</p>
        </div>
        <button
          onClick={() => {
            setEditingFlow(null)
            setFormData({
              name: '',
              description: '',
              category: 'appointment',
              trigger_type: 'intent',
              trigger_config: { keywords: [], intents: [] },
              steps: [],
              appointment_actions: [],
              ai_model: 'gemini-2.0-flash',
              is_active: true,
              priority: 0,
            })
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-bold"
        >
          <Plus size={20} />
          إنشاء تدفق جديد
        </button>
      </div>

      {/* Flows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className={`bg-white rounded-2xl shadow-sm border-2 p-6 transition-all ${
              flow.is_active
                ? 'border-green-200 hover:border-green-300'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  flow.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {getCategoryIcon(flow.category)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{flow.name}</h3>
                  <p className="text-xs text-gray-500">{getCategoryLabel(flow.category)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(flow)}
                  className={`p-2 rounded-lg transition-colors ${
                    flow.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={flow.is_active ? 'تعطيل' : 'تفعيل'}
                >
                  {flow.is_active ? <Pause size={18} /> : <Play size={18} />}
                </button>
              </div>
            </div>

            {flow.description && (
              <p className="text-sm text-gray-600 mb-4">{flow.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Zap size={14} />
                <span>نوع المشغل: {flow.trigger_type === 'intent' ? 'نية' : 'كلمة مفتاحية'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Bot size={14} />
                <span>نموذج AI: {flow.ai_model}</span>
              </div>
              {flow.appointment_actions.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  <span>إجراءات: {flow.appointment_actions.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>الخطوات: {flow.steps.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEdit(flow)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <Edit size={16} />
                تعديل
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

      {flows.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Bot size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">لا توجد تدفقات بعد</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-primary font-medium hover:underline"
          >
            إنشاء تدفق جديد
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
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
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم التدفق <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="مثال: إدارة المواعيد"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="وصف التدفق..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category || 'appointment'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="appointment">إدارة المواعيد</option>
                    <option value="information">معلومات</option>
                    <option value="support">دعم</option>
                    <option value="booking">حجز</option>
                    <option value="custom">مخصص</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع المشغل <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.trigger_type || 'intent'}
                    onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="keyword">كلمة مفتاحية</option>
                    <option value="intent">نية</option>
                    <option value="message_pattern">نمط الرسالة</option>
                    <option value="manual">يدوي</option>
                  </select>
                </div>
              </div>

              {/* Appointment Actions (for appointment category) */}
              {formData.category === 'appointment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    إجراءات المواعيد
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['create', 'update', 'confirm', 'cancel'].map((action) => (
                      <label key={action} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData.appointment_actions || []).includes(action)}
                          onChange={(e) => {
                            const actions = formData.appointment_actions || []
                            if (e.target.checked) {
                              setFormData({ ...formData, appointment_actions: [...actions, action] })
                            } else {
                              setFormData({ ...formData, appointment_actions: actions.filter(a => a !== action) })
                            }
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">
                          {action === 'create' ? 'إنشاء' : 
                           action === 'update' ? 'تعديل' :
                           action === 'confirm' ? 'تأكيد' : 'إلغاء'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نموذج AI
                </label>
                <select
                  value={formData.ai_model || 'gemini-2.0-flash'}
                  onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأولوية (كلما زاد الرقم، زادت الأولوية)
                </label>
                <input
                  type="number"
                  value={formData.priority || 0}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  تفعيل التدفق
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingFlow(null)
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-bold"
              >
                <Save size={18} />
                {editingFlow ? 'تحديث' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
