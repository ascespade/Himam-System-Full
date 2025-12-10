'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Send, Check, CheckCheck, Clock, AlertCircle, Search, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

interface WhatsAppMessage {
  id: string
  message_id: string
  from_phone: string
  to_phone: string
  message_type: string
  content: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  direction: 'inbound' | 'outbound'
  created_at: string
  delivered_at?: string
  read_at?: string
  patients?: { name: string; phone: string }
}

interface Conversation {
  id: string
  phone_number: string
  status: string
  unread_count: number
  last_message_at: string
  patients?: { name: string; phone: string }
}

export default function WhatsAppLiveLogPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    
    // Set up real-time subscription for conversations
    const conversationsChannel = supabase
      .channel('whatsapp_conversations_live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
    }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
      
      // Set up real-time subscription for messages
      const messagesChannel = supabase
        .channel(`whatsapp_messages_${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `conversation_id=eq.${selectedConversation}`,
          },
          () => {
            fetchMessages(selectedConversation)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(messagesChannel)
      }
    }
  }, [selectedConversation])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/whatsapp/conversations?status=active&limit=100')
      const data = await res.json()
      if (data.success) {
        setConversations(data.data || [])
        if (data.data && data.data.length > 0 && !selectedConversation) {
          setSelectedConversation(data.data[0].id)
        }
      } else {
        console.error('Failed to fetch conversations:', data.error)
        setConversations([])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/whatsapp/conversations/${conversationId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.data.messages || [])
      } else {
        console.error('Failed to fetch messages:', data.error)
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />
      case 'delivered':
        return <CheckCheck size={14} className="text-blue-500" />
      case 'read':
        return <CheckCheck size={14} className="text-green-500" />
      case 'failed':
        return <AlertCircle size={14} className="text-red-500" />
      default:
        return <Clock size={14} className="text-gray-400" />
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = 
      conv.phone_number.includes(searchQuery) ||
      conv.patients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة محادثات الواتساب المباشرة</h1>
            <p className="text-sm text-gray-500">مراقبة المحادثات في الوقت الفعلي</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">مباشر</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="بحث برقم الهاتف أو اسم المريض..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="archived">مؤرشف</option>
            <option value="blocked">محظور</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                <p>لا توجد محادثات</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                    selectedConversation === conv.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900">
                      {conv.patients?.name || conv.phone_number}
                    </h3>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1" dir="ltr">
                    {conv.phone_number}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(conv.last_message_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>لا توجد رسائل</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.direction === 'outbound'
                            ? 'bg-primary text-white rounded-br-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
                <p>اختر محادثة لعرض الرسائل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

