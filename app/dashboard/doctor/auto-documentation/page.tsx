'use client'

import { Bot, FileText, Calendar, Search, Settings, Play, CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DocumentationLog {
  id: string
  entity_type: string
  entity_id: string
  documentation_type: string
  generated_content: string
  ai_model: string
  status: string
  created_at: string
}

export default function AutoDocumentationPage() {
  const [logs, setLogs] = useState<DocumentationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      // TODO: Create API endpoint for auto documentation logs
      setLogs([])
    } catch (error) {
      console.error('Error fetching documentation logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDocumentationTypeText = (type: string) => {
    const types: Record<string, string> = {
      session_summary: 'ملخص جلسة',
      progress_report: 'تقرير تقدم',
      treatment_plan_update: 'تحديث خطة علاج',
      assessment_summary: 'ملخص تقييم'
    }
    return types[type] || type
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.generated_content?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || log.documentation_type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التوثيق التلقائي</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة وعرض التوثيق التلقائي بواسطة الذكاء الاصطناعي</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
          <Settings size={18} />
          الإعدادات
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث في التوثيق..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">جميع الأنواع</option>
              <option value="session_summary">ملخص جلسة</option>
              <option value="progress_report">تقرير تقدم</option>
              <option value="treatment_plan_update">تحديث خطة علاج</option>
              <option value="assessment_summary">ملخص تقييم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي التوثيق</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{logs.length}</p>
            </div>
            <Bot className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ناجح</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {logs.filter(l => l.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">فاشل</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {logs.filter(l => l.status === 'failed').length}
              </p>
            </div>
            <XCircle className="text-red-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">هذا الشهر</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {logs.filter(l => {
                  const created = new Date(l.created_at)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
            <Calendar className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Bot className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد سجلات توثيق</p>
          <p className="text-sm text-gray-400 mt-2">سيتم عرض سجلات التوثيق التلقائي هنا عند توفرها</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{getDocumentationTypeText(log.documentation_type)}</h3>
                    <p className="text-xs text-gray-500">نموذج: {log.ai_model}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  log.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {log.status === 'completed' ? 'نجح' : 'فشل'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-700 line-clamp-3">{log.generated_content}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{new Date(log.created_at).toLocaleDateString('ar-SA')}</span>
                <button className="flex items-center gap-1 text-primary hover:text-primary-dark">
                  <FileText size={14} />
                  عرض كامل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

