'use client'

import { Bot, Send, Sparkles, FileText, Clock, MessageSquare, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'diagnosis' | 'treatment' | 'general' | 'documentation'
}

interface QuickAction {
  id: string
  label: string
  prompt: string
  icon: React.ComponentType<{ size?: number; className?: string; [key: string]: unknown }>
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [patientContext, setPatientContext] = useState<Record<string, unknown> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCurrentPatient()
    // Load recent messages or start with welcome
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الطبي الذكي. يمكنني مساعدتك في:\n\n• تحليل الأعراض والتشخيص\n• اقتراح خطط العلاج\n• كتابة التوثيق الطبي\n• الإجابة على الأسئلة الطبية\n\nكيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
      type: 'general'
    }
    setMessages([welcomeMessage])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchCurrentPatient = async () => {
    try {
      const res = await fetch('/api/doctor/patient-visit')
      const data = await res.json()
      if (data.success && data.data?.patient) {
        setPatientContext(data.data.patient)
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching current patient', error, { endpoint: '/dashboard/doctor/ai-assistant' })
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'symptoms',
      label: 'تحليل الأعراض',
      prompt: 'ساعدني في تحليل أعراض المريض الحالي',
      icon: Sparkles as React.ComponentType<{ size?: number; className?: string }>
    },
    {
      id: 'diagnosis',
      label: 'اقتراح تشخيص',
      prompt: 'اقترح تشخيصاً محتملاً بناءً على التاريخ المرضي',
      icon: FileText as React.ComponentType<{ size?: number; className?: string }>
    },
    {
      id: 'treatment',
      label: 'خطة علاجية',
      prompt: 'ساعدني في وضع خطة علاجية مناسبة',
      icon: FileText as React.ComponentType<{ size?: number; className?: string }>
    },
    {
      id: 'documentation',
      label: 'كتابة ملاحظات',
      prompt: 'اكتب ملخصاً احترافياً للجلسة الحالية',
      icon: FileText as React.ComponentType<{ size?: number; className?: string }>
    }
  ]

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Build context for AI
      let context = ''
      if (patientContext) {
        context = `المريض الحالي: ${patientContext.name || 'غير محدد'}\n`
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: context
        })
      })

      const data = await res.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'فشل في الحصول على إجابة')
      }
    } catch (error: unknown) {
      const errorMessageText = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      const { logError } = await import('@/shared/utils/logger')
      logError('Error in AI assistant', error, { endpoint: '/dashboard/doctor/ai-assistant' })
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `عذراً، حدث خطأ: ${errorMessageText}. يرجى المحاولة مرة أخرى.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.prompt)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">المساعد الطبي الذكي</h1>
              <p className="text-sm text-gray-500">مساعدك الشخصي للعمل الطبي</p>
            </div>
          </div>
          {patientContext && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-700">المريض الحالي:</span>
              <span className="font-medium text-blue-900">{typeof patientContext === 'object' && patientContext !== null && 'name' in patientContext ? String(patientContext.name) : 'غير محدد'}</span>
              <button
                onClick={() => setPatientContext(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors text-right"
              >
                <Icon size={18} className="text-primary" />
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {message.role === 'assistant' && (
                    <Bot size={18} className="mt-0.5 text-primary" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-primary animate-pulse" />
                  <span className="text-sm text-gray-500">جاري التفكير...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="اكتب سؤالك أو طلبك..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              إرسال
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            اضغط Enter للإرسال، Shift+Enter للسطر الجديد
          </p>
        </div>
      </div>
    </div>
  )
}

