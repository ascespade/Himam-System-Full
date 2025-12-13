'use client'

import { Button, Card } from '@/shared/components/ui'
import { CheckCircle2, Clock, MessageCircle, RefreshCw, Send, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Message {
  id: string
  message_id: string
  from_phone: string
  to_phone: string
  message_type: string
  content: string
  direction: 'inbound' | 'outbound'
  status: string
  created_at: string
  conversation_id?: string
}

interface Conversation {
  id: string
  phone_number: string
  status: string
  last_message_at: string
  created_at: string
  inbound_count: number
  outbound_count: number
  last_message: string
}

interface DebugData {
  summary: {
    totalInbound: number
    totalOutbound: number
    totalConversations: number
    counts: {
      inbound: number
      outbound: number
      sent: number
      failed: number
    }
  }
  recentInbound: Message[]
  recentOutbound: Message[]
  recentConversations: Conversation[]
  webhookUrl: string
  checkList: Record<string, string>
}

export default function WhatsAppDebugPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<DebugData | null>(null)

  const fetchDebugData = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/whatsapp/debug')
      const result = await res.json()
      if (result.success) {
        setData(result)
      } else {
        toast.error('فشل في تحميل البيانات: ' + result.error)
      }
    } catch (error: unknown) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error in WhatsApp debug', error, { endpoint: '/dashboard/admin/whatsapp/debug' })
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
      toast.error('خطأ: ' + errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ar-SA', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <p className="text-gray-600">لا توجد بيانات للعرض</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">WhatsApp Debug & Monitoring</h1>
        <Button
          onClick={fetchDebugData}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الرسائل الواردة</p>
              <p className="text-2xl font-bold text-blue-600">{data.summary.totalInbound}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الرسائل الصادرة</p>
              <p className="text-2xl font-bold text-green-600">{data.summary.totalOutbound}</p>
            </div>
            <Send className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المحادثات</p>
              <p className="text-2xl font-bold text-purple-600">{data.summary.totalConversations}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الرسائل المرسلة بنجاح</p>
              <p className="text-2xl font-bold text-emerald-600">{data.summary.counts.sent}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
        </Card>
      </div>

      {/* Webhook Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Webhook Information</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Webhook URL:</span>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{data.webhookUrl}</code>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="font-medium">Checklist:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {Object.entries(data.checkList).map(([key, value]) => (
                <li key={key}>
                  <span className="font-medium">{key}:</span> {value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Recent Inbound Messages */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">آخر الرسائل الواردة (10)</h2>
        <div className="space-y-3">
          {data.recentInbound.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد رسائل واردة</p>
          ) : (
            data.recentInbound.map((msg) => (
              <div key={msg.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">من:</span>
                      <span className="text-sm">{msg.from_phone}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-800">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {msg.status === 'delivered' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Recent Outbound Messages */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">آخر الرسائل الصادرة (10)</h2>
        <div className="space-y-3">
          {data.recentOutbound.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد رسائل صادرة</p>
          ) : (
            data.recentOutbound.map((msg) => (
              <div key={msg.id} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">إلى:</span>
                      <span className="text-sm">{msg.to_phone}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-800">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {msg.status === 'sent' || msg.status === 'delivered' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : msg.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Recent Conversations */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">المحادثات الأخيرة (10)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">رقم الهاتف</th>
                <th className="text-right p-2">الحالة</th>
                <th className="text-right p-2">الرسائل الواردة</th>
                <th className="text-right p-2">الرسائل الصادرة</th>
                <th className="text-right p-2">آخر رسالة</th>
                <th className="text-right p-2">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {data.recentConversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    لا توجد محادثات
                  </td>
                </tr>
              ) : (
                data.recentConversations.map((conv) => (
                  <tr key={conv.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{conv.phone_number}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          conv.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {conv.status}
                      </span>
                    </td>
                    <td className="p-2">{conv.inbound_count}</td>
                    <td className="p-2">{conv.outbound_count}</td>
                    <td className="p-2 text-sm text-gray-600 max-w-xs truncate">
                      {conv.last_message}
                    </td>
                    <td className="p-2 text-xs text-gray-500">
                      {formatDate(conv.last_message_at || conv.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}




