'use client'

import { Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from '@/shared/utils/toast'

interface BusinessRule {
  id: string
  name: string
  description: string
  type: string
  condition: Record<string, unknown>
  action: 'allow' | 'block' | 'warn' | 'require_approval'
  priority: number
  is_active: boolean
  applies_to: string[]
  error_message?: string
}

export default function BusinessRulesPage() {
  const [rules, setRules] = useState<BusinessRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/business-rules')
      const data = await res.json()
      if (data.success) {
        setRules(data.data || [])
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching rules', error, { endpoint: '/dashboard/admin/business-rules' })
      toast.error('فشل تحميل القواعد')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/business-rules/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        toast.success('تم حذف القاعدة بنجاح')
        fetchRules()
      } else {
        toast.error(data.error || 'فشل الحذف')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const handleSave = async (rule: BusinessRule) => {
    try {
      const url = rule.id ? `/api/admin/business-rules/${rule.id}` : '/api/admin/business-rules'
      const method = rule.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(rule.id ? 'تم تحديث القاعدة بنجاح' : 'تم إنشاء القاعدة بنجاح')
        setShowForm(false)
        setEditingRule(null)
        fetchRules()
      } else {
        toast.error(data.error || 'فشل الحفظ')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ')
    }
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

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة القواعد التجارية</h1>
          <p className="text-gray-500 text-lg">قواعد العمل الديناميكية القابلة للتعديل</p>
        </div>
        <button
          onClick={() => {
            setEditingRule(null)
            setShowForm(true)
          }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          إضافة قاعدة جديدة
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{rule.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      rule.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {rule.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    أولوية: {rule.priority}
                  </span>
                </div>
                {rule.description && (
                  <p className="text-gray-600 mb-2">{rule.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>النوع: {rule.type}</span>
                  <span>الإجراء: {rule.action}</span>
                  <span>ينطبق على: {rule.applies_to.join(', ')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRule(rule)
                    setShowForm(true)
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {rule.error_message && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                <AlertCircle size={16} className="inline mr-2" />
                {rule.error_message}
              </div>
            )}
          </div>
        ))}

        {rules.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Settings className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد قواعد</h3>
            <p className="text-gray-500 mb-6">ابدأ بإضافة قاعدة جديدة</p>
            <button
              onClick={() => {
                setEditingRule(null)
                setShowForm(true)
              }}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              إضافة قاعدة جديدة
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRule ? 'تعديل القاعدة' : 'إضافة قاعدة جديدة'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingRule(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <RuleForm
              rule={editingRule}
              onSave={(rule) => {
                handleSave(rule)
              }}
              onCancel={() => {
                setShowForm(false)
                setEditingRule(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RuleForm({
  rule,
  onSave,
  onCancel
}: {
  rule: BusinessRule | null
  onSave: (rule: BusinessRule) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<BusinessRule>>({
    name: rule?.name || '',
    description: rule?.description || '',
    type: rule?.type || 'payment_required',
    action: rule?.action || 'block',
    priority: rule?.priority || 0,
    is_active: rule?.is_active !== undefined ? rule.is_active : true,
    applies_to: rule?.applies_to || ['all'],
    error_message: rule?.error_message || '',
    condition: rule?.condition || {}
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: rule?.id || '',
      name: formData.name || '',
      description: formData.description || '',
      type: formData.type || 'payment_required',
      condition: formData.condition || {},
      action: formData.action || 'block',
      priority: formData.priority || 0,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      applies_to: formData.applies_to || ['all'],
      error_message: formData.error_message,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">اسم القاعدة *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="مثال: الدفع مطلوب قبل الجلسة"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="وصف القاعدة..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">النوع *</label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="payment_required">الدفع مطلوب</option>
            <option value="insurance_approval_required">موافقة التأمين مطلوبة</option>
            <option value="first_visit_free">أول زيارة مجانية</option>
            <option value="session_data_complete">اكتمال بيانات الجلسة</option>
            <option value="insurance_template_match">مطابقة قالب التأمين</option>
            <option value="error_pattern_avoid">تجنب نمط خطأ</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الإجراء *</label>
          <select
            required
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value as 'allow' | 'block' | 'warn' | 'require_approval' })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="allow">السماح</option>
            <option value="block">منع</option>
            <option value="warn">تحذير</option>
            <option value="require_approval">يتطلب موافقة</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الأولوية</label>
          <input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
          <select
            value={formData.is_active ? 'true' : 'false'}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="true">نشط</option>
            <option value="false">غير نشط</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">ينطبق على</label>
        <div className="flex flex-wrap gap-2">
          {['all', 'reception', 'doctor', 'billing'].map((role) => (
            <label key={role} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.applies_to?.includes(role)}
                onChange={(e) => {
                  const current = formData.applies_to || []
                  if (e.target.checked) {
                    setFormData({ ...formData, applies_to: [...current, role] })
                  } else {
                    setFormData({ ...formData, applies_to: current.filter(r => r !== role) })
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                {role === 'all' ? 'الكل' : role === 'reception' ? 'الاستقبال' : role === 'doctor' ? 'الطبيب' : 'الفواتير'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">رسالة الخطأ</label>
        <input
          type="text"
          value={formData.error_message}
          onChange={(e) => setFormData({ ...formData, error_message: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="رسالة تظهر عند انتهاك القاعدة"
        />
      </div>

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
  )
}
