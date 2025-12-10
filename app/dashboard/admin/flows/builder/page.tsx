'use client'

/**
 * Visual Flow Builder Page
 * No-code flow creation interface
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Save, X, Plus, Trash2, Play, Settings, Zap, Database, Bot, Bell, Clock, Webhook, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface FlowNode {
  id: string
  type: string
  label: string
  config: Record<string, any>
}

export default function FlowBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const flowId = searchParams.get('id')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: 'whatsapp',
    category: 'automation',
    trigger_type: 'event',
    trigger_config: {} as Record<string, any>,
    nodes: [] as FlowNode[],
    edges: [] as any[],
    execution_mode: 'async' as 'sync' | 'async' | 'background',
    ai_enabled: false,
    ai_model: 'gemini-2.0-flash',
    ai_prompt: '',
    is_active: true,
    priority: 0,
    tags: [] as string[],
  })

  useEffect(() => {
    if (flowId) {
      loadFlow()
    }
  }, [flowId])

  const loadFlow = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/flows/${flowId}`)
      const data = await res.json()
      if (data.success) {
        setFormData({
          name: data.data.name || '',
          description: data.data.description || '',
          module: data.data.module || 'whatsapp',
          category: data.data.category || 'automation',
          trigger_type: data.data.trigger_type || 'event',
          trigger_config: data.data.trigger_config || {},
          nodes: data.data.nodes || [],
          edges: data.data.edges || [],
          execution_mode: data.data.execution_mode || 'async',
          ai_enabled: data.data.ai_enabled || false,
          ai_model: data.data.ai_model || 'gemini-2.0-flash',
          ai_prompt: data.data.ai_prompt || '',
          is_active: data.data.is_active !== false,
          priority: data.data.priority || 0,
          tags: data.data.tags || [],
        })
      } else {
        toast.error('فشل تحميل التدفق')
        router.push('/dashboard/admin/flows')
      }
    } catch (error) {
      console.error('Error loading flow:', error)
      toast.error('حدث خطأ أثناء تحميل التدفق')
    } finally {
      setLoading(false)
    }
  }

  const addNode = (type: string) => {
    const nodeTypes: Record<string, { label: string; icon: any; defaultConfig: any }> = {
      trigger: { label: 'بداية التدفق', icon: Zap, defaultConfig: {} },
      condition: { label: 'شرط', icon: CheckCircle, defaultConfig: { condition: '{{input.status}} == "active"' } },
      ai_analysis: { label: 'تحليل AI', icon: Bot, defaultConfig: { prompt: 'حلل الرسالة التالية' } },
      database_query: { label: 'استعلام قاعدة البيانات', icon: Database, defaultConfig: { table: 'patients', filters: {} } },
      database_update: { label: 'تحديث قاعدة البيانات', icon: Database, defaultConfig: { table: 'patients', updates: {} } },
      api_call: { label: 'استدعاء API', icon: Webhook, defaultConfig: { url: '', method: 'GET', headers: {}, body: {} } },
      notification: { label: 'إشعار', icon: Bell, defaultConfig: { type: 'email', recipient: '', subject: '', message: '' } },
      delay: { label: 'تأخير', icon: Clock, defaultConfig: { delay: 1000 } },
      transform: { label: 'تحويل البيانات', icon: Settings, defaultConfig: { transform: {} } },
    }

    const nodeType = nodeTypes[type]
    if (!nodeType) return

    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type,
      label: nodeType.label,
      config: { ...nodeType.defaultConfig },
    }

    setFormData({
      ...formData,
      nodes: [...formData.nodes, newNode],
    })
  }

  const removeNode = (nodeId: string) => {
    setFormData({
      ...formData,
      nodes: formData.nodes.filter(n => n.id !== nodeId),
      edges: formData.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    })
  }

  const updateNodeConfig = (nodeId: string, config: Record<string, any>) => {
    setFormData({
      ...formData,
      nodes: formData.nodes.map(n =>
        n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
      ),
    })
  }

  const handleSave = async () => {
    if (!formData.name || formData.nodes.length === 0) {
      toast.error('يرجى إدخال اسم التدفق وإضافة عقد واحدة على الأقل')
      return
    }

    try {
      setSaving(true)
      const url = flowId ? `/api/flows/${flowId}` : '/api/flows'
      const method = flowId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(flowId ? 'تم تحديث التدفق بنجاح' : 'تم إنشاء التدفق بنجاح')
        router.push('/dashboard/admin/flows')
      } else {
        toast.error('فشل حفظ التدفق: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error: any) {
      console.error('Error saving flow:', error)
      toast.error('حدث خطأ أثناء حفظ التدفق: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل التدفق...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            {flowId ? 'تعديل التدفق' : 'إنشاء تدفق جديد'}
          </h1>
          <p className="text-gray-500 text-lg">بناء تدفق آلي بدون كود</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/admin/flows')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-bold disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Flow Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات أساسية</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم التدفق <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="مثال: إدارة المواعيد عبر الواتساب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="وصف التدفق..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوحدة <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="whatsapp">واتساب</option>
                  <option value="appointments">المواعيد</option>
                  <option value="patients">المرضى</option>
                  <option value="billing">الفواتير</option>
                  <option value="custom">مخصص</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع المشغل <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="event">حدث</option>
                  <option value="webhook">Webhook</option>
                  <option value="condition">شرط</option>
                  <option value="api_call">استدعاء API</option>
                  <option value="database_change">تغيير قاعدة البيانات</option>
                  <option value="user_action">إجراء مستخدم</option>
                  <option value="ai_detection">كشف AI</option>
                  <option value="time_based">وقت محدد</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  تفعيل التدفق
                </label>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">إعدادات AI</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ai_enabled"
                  checked={formData.ai_enabled}
                  onChange={(e) => setFormData({ ...formData, ai_enabled: e.target.checked })}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="ai_enabled" className="text-sm font-medium text-gray-700">
                  تفعيل AI
                </label>
              </div>

              {formData.ai_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نموذج AI</label>
                    <select
                      value={formData.ai_model}
                      onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prompt</label>
                    <textarea
                      value={formData.ai_prompt}
                      onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={4}
                      placeholder="أدخل prompt للـ AI..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Area - Flow Nodes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Nodes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">إضافة عقد</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { type: 'trigger', icon: Zap, label: 'بداية' },
                { type: 'condition', icon: CheckCircle, label: 'شرط' },
                { type: 'ai_analysis', icon: Bot, label: 'AI' },
                { type: 'database_query', icon: Database, label: 'استعلام' },
                { type: 'database_update', icon: Database, label: 'تحديث' },
                { type: 'api_call', icon: Webhook, label: 'API' },
                { type: 'notification', icon: Bell, label: 'إشعار' },
                { type: 'delay', icon: Clock, label: 'تأخير' },
                { type: 'transform', icon: Settings, label: 'تحويل' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Icon size={24} className="text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Flow Nodes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">عقد التدفق ({formData.nodes.length})</h2>
            {formData.nodes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Zap size={48} className="mx-auto mb-4 text-gray-400" />
                <p>لا توجد عقد بعد. اضغط على الأزرار أعلاه لإضافة عقد.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.nodes.map((node, index) => (
                  <NodeEditor
                    key={node.id}
                    node={node}
                    index={index}
                    onUpdate={(config) => updateNodeConfig(node.id, config)}
                    onRemove={() => removeNode(node.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NodeEditor({ node, index, onUpdate, onRemove }: {
  node: FlowNode
  index: number
  onUpdate: (config: Record<string, any>) => void
  onRemove: () => void
}) {
  const [config, setConfig] = useState(node.config)

  useEffect(() => {
    onUpdate(config)
  }, [config])

  const renderConfigFields = () => {
    switch (node.type) {
      case 'condition':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الشرط</label>
            <input
              type="text"
              value={config.condition || ''}
              onChange={(e) => setConfig({ ...config, condition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder='مثال: {{input.status}} == "active"'
            />
          </div>
        )

      case 'ai_analysis':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prompt</label>
            <textarea
              value={config.prompt || ''}
              onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
              placeholder="أدخل prompt للتحليل..."
            />
          </div>
        )

      case 'database_query':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم الجدول</label>
              <input
                type="text"
                value={config.table || ''}
                onChange={(e) => setConfig({ ...config, table: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="patients"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الفلاتر (JSON)</label>
              <textarea
                value={JSON.stringify(config.filters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    setConfig({ ...config, filters: JSON.parse(e.target.value) })
                  } catch {}
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                rows={3}
                placeholder='{"status": "active"}'
              />
            </div>
          </div>
        )

      case 'database_update':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم الجدول</label>
              <input
                type="text"
                value={config.table || ''}
                onChange={(e) => setConfig({ ...config, table: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="patients"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التحديثات (JSON)</label>
              <textarea
                value={JSON.stringify(config.updates || {}, null, 2)}
                onChange={(e) => {
                  try {
                    setConfig({ ...config, updates: JSON.parse(e.target.value) })
                  } catch {}
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                rows={3}
                placeholder='{"status": "active"}'
              />
            </div>
          </div>
        )

      case 'api_call':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => setConfig({ ...config, method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        )

      case 'notification':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
              <select
                value={config.type || 'email'}
                onChange={(e) => setConfig({ ...config, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المستلم</label>
              <input
                type="text"
                value={config.recipient || ''}
                onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الموضوع</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="موضوع الإشعار"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الرسالة</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="محتوى الرسالة..."
              />
            </div>
          </div>
        )

      case 'delay':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">التأخير (بالميلي ثانية)</label>
            <input
              type="number"
              value={config.delay || 1000}
              onChange={(e) => setConfig({ ...config, delay: parseInt(e.target.value) || 1000 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              min="0"
            />
          </div>
        )

      default:
        return <p className="text-sm text-gray-500">لا توجد إعدادات مطلوبة</p>
    }
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
            {index + 1}
          </span>
          <h3 className="font-bold text-gray-900">{node.label}</h3>
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {renderConfigFields()}
    </div>
  )
}
