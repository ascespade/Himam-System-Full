'use client'

/**
 * AI Assistant for Doctors
 * مساعد ذكي للطبيب
 * - يساعد في التشخيص
 * - يقترح خطط علاجية
 * - يحلل التقدم
 * - يكتشف المخاطر
 */

import { Bot, Send, Sparkles, AlertTriangle, TrendingUp, FileText, X } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePatientContext } from '@/contexts/PatientContext'

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'suggestion' | 'warning' | 'analysis' | 'general'
}

export default function AIAssistant() {
  const { currentPatient } = usePatientContext()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const generateInitialAnalysis = useCallback(async () => {
    if (!currentPatient) return

    setLoading(true)
    try {
      const res = await fetch('/api/ai/doctor-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initial_analysis',
          patient_id: currentPatient.id
        })
      })

      const data = await res.json()
      if (data.success) {
        setMessages([
          {
            role: 'assistant',
            content: data.analysis,
            timestamp: new Date(),
            type: 'analysis'
          }
        ])
      }
    } catch (error) {
      console.error('Error generating initial analysis:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPatient])

  useEffect(() => {
    if (isOpen && currentPatient) {
      // Auto-generate initial analysis when opening with a patient
      generateInitialAnalysis()
    }
  }, [isOpen, currentPatient, generateInitialAnalysis])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: AIMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/doctor-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          patient_id: currentPatient?.id,
          message: input,
          history: messages.slice(-5) // Last 5 messages for context
        })
      })

      const data = await res.json()
      if (data.success) {
        const assistantMessage: AIMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          type: data.type || 'general'
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error: any) {
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `عذراً، حدث خطأ: ${error.message}`,
        timestamp: new Date(),
        type: 'general'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'suggestion':
        return <Sparkles size={16} className="text-blue-500" />
      case 'warning':
        return <AlertTriangle size={16} className="text-red-500" />
      case 'analysis':
        return <TrendingUp size={16} className="text-green-500" />
      default:
        return <Bot size={16} className="text-primary" />
    }
  }

  const getMessageBg = (type?: string) => {
    switch (type) {
      case 'suggestion':
        return 'bg-blue-50 border-blue-200'
      case 'warning':
        return 'bg-red-50 border-red-200'
      case 'analysis':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
        title="مساعد الذكاء الاصطناعي"
      >
        <Bot size={24} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 left-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-bold">مساعد الطبيب الذكي</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-8">
            <Bot size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">مرحباً! كيف يمكنني مساعدتك اليوم؟</p>
            {currentPatient && (
              <p className="text-xs mt-2">أنا هنا لمساعدتك في رعاية {currentPatient.name}</p>
            )}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : `${getMessageBg(msg.type)} border`
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  {getMessageIcon(msg.type)}
                  <span className="text-xs font-bold opacity-70">
                    {msg.type === 'suggestion' ? 'اقتراح' :
                     msg.type === 'warning' ? 'تحذير' :
                     msg.type === 'analysis' ? 'تحليل' : 'مساعد'}
                  </span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-500">جاري التفكير...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            dir="rtl"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        {currentPatient && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            العمل مع: {currentPatient.name}
          </p>
        )}
      </div>
    </div>
  )
}

