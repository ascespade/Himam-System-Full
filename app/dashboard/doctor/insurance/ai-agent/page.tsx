'use client'

import { Bot, Activity, TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw, Play, Settings, Sparkles, Database } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface LearningPattern {
  id: string
  insurance_provider: string
  claim_type: string
  success_count: number
  rejection_count: number
  common_errors: string[]
  success_patterns: string[]
  rejection_reasons: string[]
  updated_at: string
}

interface Claim {
  id: string
  claim_number: string
  patient_name: string
  status: string
  amount: number
  submitted_date?: string
  rejection_reason?: string
}

interface Statistics {
  total: number
  approved: number
  rejected: number
  approvalRate: string
}

export default function InsuranceAIAgentPage() {
  const [patterns, setPatterns] = useState<LearningPattern[]>([])
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [monitoring, setMonitoring] = useState<Record<string, unknown> | null>(null)
  const [vectorStats, setVectorStats] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetchData()
    fetchMonitoring()
    fetchVectorStats()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData()
      fetchMonitoring()
      fetchVectorStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/doctor/insurance/ai-agent')
      const data = await res.json()
      if (data.success) {
        setPatterns(data.data.patterns || [])
        setPendingClaims(data.data.pendingClaims || [])
        setStatistics(data.data.statistics)
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching AI agent data', error, { endpoint: '/dashboard/doctor/insurance/ai-agent' })
    } finally {
      setLoading(false)
    }
  }

  const fetchMonitoring = async () => {
    try {
      const res = await fetch('/api/doctor/insurance/ai-agent/monitor')
      const data = await res.json()
      if (data.success) {
        setMonitoring(data.data)
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching monitoring data', error, { endpoint: '/dashboard/doctor/insurance/ai-agent' })
    }
  }

  const fetchVectorStats = async () => {
    try {
      // Check vector embeddings status
      const res = await fetch('/api/doctor/insurance/ai-agent/embeddings/status')
      if (res.ok) {
        const data = await res.json()
        setVectorStats(data.data)
      }
    } catch (error) {
      // Endpoint might not exist yet, that's okay
      setVectorStats({ enabled: false })
    }
  }

  const handleAutoFollowup = async (claimId: string, action: 'resubmit' | 'escalate') => {
    try {
      const res = await fetch('/api/doctor/insurance/ai-agent/monitor/auto-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claimId, action })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'تمت العملية بنجاح')
        fetchData()
        fetchMonitoring()
      } else {
        throw new Error(data.error || 'فشلت العملية')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Bot className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المساعد الذكي للتأمين</h1>
            <p className="text-sm text-gray-500 mt-1">إدارة تلقائية للمطالبات مع التعلم الآلي والفيكتورز</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchData()
              fetchMonitoring()
              fetchVectorStats()
              toast.success('تم التحديث')
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw size={18} />
            تحديث
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Settings size={18} />
            الإعدادات
          </button>
        </div>
      </div>

      {/* Vector Status */}
      {vectorStats && (
        <div className={`rounded-xl p-4 border ${
          vectorStats.enabled 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            <Database className={vectorStats.enabled ? 'text-green-600' : 'text-yellow-600'} size={24} />
            <div>
              <h3 className="font-bold text-gray-900">
                {vectorStats.enabled ? 'نظام الفيكتورز مفعّل' : 'نظام الفيكتورز غير مفعّل'}
              </h3>
              <p className="text-sm text-gray-600">
                {vectorStats.enabled 
                  ? `تم العثور على ${vectorStats.total_embeddings || 0} تمثيل نوctorي للمطالبات`
                  : 'يحتاج تفعيل pgvector extension في قاعدة البيانات'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي المطالبات</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
              </div>
              <Activity className="text-primary" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">موافق عليها</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{statistics.approved}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مرفوضة</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{statistics.rejected}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">معدل الموافقة</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.approvalRate}%</p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Alerts */}
      {(() => {
        if (!monitoring || !monitoring.summary || typeof monitoring.summary !== 'object') return null
        const summary = monitoring.summary as Record<string, unknown>
        const totalNeedingAttention = typeof summary.totalNeedingAttention === 'number' ? summary.totalNeedingAttention : 0
        if (totalNeedingAttention <= 0) return null
        
        const followUpCount = typeof summary.followUpCount === 'number' ? summary.followUpCount : 0
        const resubmissionCount = typeof summary.resubmissionCount === 'number' ? summary.resubmissionCount : 0
        const specialCasesCount = typeof summary.specialCasesCount === 'number' ? summary.specialCasesCount : 0
        
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-yellow-600" size={24} />
                <div>
                  <h3 className="font-bold text-yellow-900">مطالبات تحتاج متابعة</h3>
                  <p className="text-sm text-yellow-700">
                    {totalNeedingAttention} مطالبة تحتاج انتباه
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                  متابعة: {followUpCount}
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
                  إعادة إرسال: {resubmissionCount}
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                  حالات خاصة: {specialCasesCount}
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Learning Patterns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bot size={24} className="text-primary" />
                أنماط التعلم
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                أنماط التعلم من المطالبات السابقة مع تحليل الفيكتورز
              </p>
            </div>
            {vectorStats && typeof vectorStats.enabled === 'boolean' && vectorStats.enabled ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <Sparkles size={16} />
                Vector Search مفعّل
              </div>
            ) : null}
          </div>
        </div>
        <div className="p-6">
          {patterns.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">لا توجد أنماط تعلم بعد</p>
              <p className="text-sm text-gray-400 mt-2">
                سيتم إنشاء الأنماط تلقائياً مع معالجة المطالبات
                {vectorStats && typeof vectorStats.enabled === 'boolean' && vectorStats.enabled ? ' (باستخدام الفيكتورز)' : ''}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{pattern.insurance_provider}</h3>
                      <p className="text-sm text-gray-500">{pattern.claim_type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">معدل النجاح</div>
                      <div className="text-lg font-bold text-green-600">
                        {pattern.success_count + pattern.rejection_count > 0
                          ? ((pattern.success_count / (pattern.success_count + pattern.rejection_count)) * 100).toFixed(1)
                          : '0'}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">نجاح:</span>
                      <span className="text-green-600 font-medium mr-2">{pattern.success_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">رفض:</span>
                      <span className="text-red-600 font-medium mr-2">{pattern.rejection_count}</span>
                    </div>
                  </div>
                  {pattern.common_errors && pattern.common_errors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">الأخطاء الشائعة (متعلم من الفيكتورز):</p>
                      <div className="flex flex-wrap gap-2">
                        {pattern.common_errors.slice(0, 5).map((error, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                            {error}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {pattern.rejection_reasons && pattern.rejection_reasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">أسباب الرفض المتكررة:</p>
                      <div className="flex flex-wrap gap-2">
                        {pattern.rejection_reasons.slice(0, 3).map((reason, idx) => (
                          <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                            {reason.substring(0, 50)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Claims Needing Attention */}
      {monitoring && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock size={24} className="text-yellow-600" />
              المطالبات التي تحتاج متابعة
            </h2>
          </div>
          <div className="p-6">
            {monitoring && monitoring.needsFollowUp && Array.isArray(monitoring.needsFollowUp) && monitoring.needsFollowUp.length > 0 ? (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">متابعة ({(monitoring.needsFollowUp as Claim[]).length})</h3>
                <div className="space-y-2">
                  {(monitoring.needsFollowUp as Claim[]).map((claim: Claim) => (
                    <div key={claim.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{claim.claim_number}</p>
                          <p className="text-sm text-gray-500">{claim.patient_name}</p>
                        </div>
                        <button
                          onClick={() => handleAutoFollowup(claim.id, 'escalate')}
                          className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                        >
                          تصعيد
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {monitoring && monitoring.needsResubmission && Array.isArray(monitoring.needsResubmission) && monitoring.needsResubmission.length > 0 ? (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">إعادة إرسال ({(monitoring.needsResubmission as Claim[]).length})</h3>
                <div className="space-y-2">
                  {(monitoring.needsResubmission as Claim[]).map((claim: Claim) => (
                    <div key={claim.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{claim.claim_number}</p>
                          <p className="text-sm text-gray-500">{claim.patient_name}</p>
                          {claim.rejection_reason && (
                            <p className="text-xs text-red-600 mt-1">سبب الرفض: {claim.rejection_reason}</p>
                          )}
                          <p className="text-xs text-blue-600 mt-1">
                            💡 سيتم تحليل الفيكتورز لتحسين إعادة الإرسال
                          </p>
                        </div>
                        <button
                          onClick={() => handleAutoFollowup(claim.id, 'resubmit')}
                          className="px-3 py-1 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 flex items-center gap-1"
                        >
                          <Play size={14} />
                          إعادة إرسال تلقائي
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {monitoring && monitoring.specialCases && Array.isArray(monitoring.specialCases) && monitoring.specialCases.length > 0 ? (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">حالات خاصة ({(monitoring.specialCases as Claim[]).length})</h3>
                <div className="space-y-2">
                  {(monitoring.specialCases as Claim[]).map((claim: Claim) => (
                    <div key={claim.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{claim.claim_number}</p>
                          <p className="text-sm text-gray-500">{claim.patient_name}</p>
                          <p className="text-xs text-red-600 mt-1">تحتاج مراجعة يدوية</p>
                        </div>
                        <button
                          onClick={() => handleAutoFollowup(claim.id, 'escalate')}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                          تصعيد للطبيب
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(!monitoring.needsFollowUp || !Array.isArray(monitoring.needsFollowUp) || monitoring.needsFollowUp.length === 0) &&
             (!monitoring.needsResubmission || !Array.isArray(monitoring.needsResubmission) || monitoring.needsResubmission.length === 0) &&
             (!monitoring.specialCases || !Array.isArray(monitoring.specialCases) || monitoring.specialCases.length === 0) && (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <p className="text-gray-500">جميع المطالبات في حالة جيدة</p>
                {vectorStats && typeof vectorStats.enabled === 'boolean' && vectorStats.enabled && (
                  <p className="text-sm text-gray-400 mt-2">
                    نظام الفيكتورز يعمل على تحليل المطالبات وتجنب الأخطاء
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
