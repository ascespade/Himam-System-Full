'use client'

/**
 * Configuration Management UI
 * واجهة إدارة الإعدادات الديناميكية
 * تسمح للمدير بتعديل جميع إعدادات النظام بدون كود
 */

import { useEffect, useState } from 'react'
import { Save, Plus, Trash2, Settings, RefreshCw } from 'lucide-react'
import { logError } from '@/shared/utils/logger'
import { toastError, toastSuccess } from '@/shared/utils/toast'

interface Configuration {
  id: string
  category: string
  key: string
  value: any
  description: string
  is_editable: boolean
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<Configuration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newConfig, setNewConfig] = useState({
    category: '',
    key: '',
    value: '',
    description: ''
  })

  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/system/config')
      const data = await res.json()
      if (data.success) {
        // Flatten config object to array
        const configArray: Configuration[] = []
        Object.keys(data.data).forEach(category => {
          Object.keys(data.data[category]).forEach(key => {
            configArray.push({
              id: `${category}-${key}`,
              category,
              key,
              ...data.data[category][key]
            })
          })
        })
        setConfigs(configArray)
      }
    } catch (error) {
      logError('Error loading configurations', error, { endpoint: '/api/settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (config: Configuration, newValue: any) => {
    try {
      setSaving(true)
      const res = await fetch('/api/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: config.category,
          key: config.key,
          value: typeof newValue === 'string' ? JSON.parse(newValue) : newValue,
          description: config.description
        })
      })

      const data = await res.json()
      if (data.success) {
        await loadConfigurations()
        toastSuccess('تم حفظ الإعدادات بنجاح')
      } else {
        const errorMessage = data.error || 'خطأ غير معروف'
        logError('Failed to save settings', new Error(errorMessage), { endpoint: '/api/settings' })
        toastError('فشل في حفظ الإعدادات: ' + errorMessage)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف'
      logError('Error saving settings', error, { endpoint: '/api/settings' })
      toastError('حدث خطأ: ' + errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    try {
      if (!newConfig.category || !newConfig.key || !newConfig.value) {
        toastError('يرجى ملء جميع الحقول المطلوبة')
        return
      }

      const res = await fetch('/api/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newConfig.category,
          key: newConfig.key,
          value: JSON.parse(newConfig.value),
          description: newConfig.description
        })
      })

      const data = await res.json()
      if (data.success) {
        await loadConfigurations()
        setShowAddForm(false)
        setNewConfig({ category: '', key: '', value: '', description: '' })
        toastSuccess('تم إضافة الإعداد بنجاح')
      } else {
        const errorMessage = data.error || 'خطأ غير معروف'
        logError('Failed to add configuration', new Error(errorMessage), { endpoint: '/api/settings' })
        toastError('فشل في إضافة الإعداد: ' + errorMessage)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف'
      logError('Error adding configuration', error, { endpoint: '/api/settings' })
      toastError('حدث خطأ: ' + errorMessage)
    }
  }

  const categories = [...new Set(configs.map(c => c.category))]

  const filteredConfigs = selectedCategory === 'all'
    ? configs
    : configs.filter(c => c.category === selectedCategory)

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الإعدادات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إعدادات النظام</h1>
        <p className="text-gray-500 text-lg">إدارة جميع إعدادات النظام بشكل ديناميكي</p>
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
            إضافة إعداد جديد
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

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">إضافة إعداد جديد</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الفئة</label>
              <input
                type="text"
                value={newConfig.category}
                onChange={(e) => setNewConfig({ ...newConfig, category: e.target.value })}
                placeholder="مثال: doctor, insurance, whatsapp"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المفتاح</label>
              <input
                type="text"
                value={newConfig.key}
                onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                placeholder="مثال: auto_select_patient"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">القيمة (JSON)</label>
              <textarea
                rows={3}
                value={newConfig.value}
                onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                placeholder='{"enabled": true, "value": 100}'
                className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
              <input
                type="text"
                value={newConfig.description}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                placeholder="وصف الإعداد"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
              >
                <Save size={18} />
                حفظ
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configurations List */}
      <div className="space-y-4">
        {filteredConfigs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Settings size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">لا توجد إعدادات في هذه الفئة</p>
          </div>
        ) : (
          filteredConfigs.map((config) => (
            <div key={config.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{config.key}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {getCategoryLabel(config.category)}
                    </span>
                    {!config.is_editable && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                        للقراءة فقط
                      </span>
                    )}
                  </div>
                  {config.description && (
                    <p className="text-sm text-gray-500 mb-3">{config.description}</p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(config.value, null, 2)}
                </pre>
              </div>
              {config.is_editable && (
                <div className="flex gap-3">
                  <textarea
                    rows={3}
                    defaultValue={JSON.stringify(config.value, null, 2)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                    placeholder="قيمة جديدة (JSON)"
                    id={`value-${config.id}`}
                  />
                  <button
                    onClick={() => {
                      const textarea = document.getElementById(`value-${config.id}`) as HTMLTextAreaElement
                      if (textarea) {
                        handleSave(config, textarea.value)
                      }
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    حفظ
                  </button>
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
    doctor: 'الطبيب',
    insurance: 'التأمين',
    reception: 'الاستقبال',
    whatsapp: 'الواتساب',
    general: 'عام',
    ai: 'الذكاء الاصطناعي',
    notifications: 'الإشعارات'
  }
  return labels[category] || category
}
