'use client'

import { useState, useEffect } from 'react'

interface Conversation {
  phone: string
  lastMessage: string
  date: string
}

interface Message {
  id: string
  user_message: string
  ai_response: string
  created_at: string
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone)
    }
  }, [selectedPhone])

  const fetchConversations = async () => {
    const res = await fetch('/api/chat/conversations')
    const data = await res.json()
    if (data.success) {
       setConversations(data.data)
       setLoading(false)
    }
  }

  const fetchMessages = async (phone: string) => {
    const res = await fetch(`/api/chat-history?phone=${phone}`)
    const data = await res.json()
    if (data.success) {
      setMessages(data.data)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-l border-gray-100 flex flex-col bg-gray-50">
         <div className="p-4 border-b border-gray-100 font-bold text-lg text-gray-700">
            الرسائل
         </div>
         <div className="flex-1 overflow-y-auto">
            {loading ? (
               <div className="p-4 text-center text-gray-400">تحميل...</div>
            ) : conversations.map(c => (
               <div 
                 key={c.phone}
                 onClick={() => setSelectedPhone(c.phone)}
                 className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${selectedPhone === c.phone ? 'bg-white border-r-4 border-primary' : ''}`}
               >
                  <div className="flex justify-between mb-1">
                     <span className="font-bold text-sm text-gray-900" dir="ltr">{c.phone}</span>
                     <span className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate h-4 line-clamp-1">{c.lastMessage}</p>
               </div>
            ))}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#efeae2]"> {/* WhatsApp-like BG color */}
         {selectedPhone ? (
           <>
              <div className="p-4 bg-gray-100 border-b border-gray-200 shadow-sm flex items-center justify-between">
                 <h2 className="font-bold" dir="ltr">{selectedPhone}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {messages.map(m => (
                    <div key={m.id} className="flex flex-col space-y-2">
                       {/* User Bubble */}
                       <div className="self-start max-w-[70%] bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                          <p className="text-sm text-gray-800">{m.user_message}</p>
                          <span className="text-[10px] text-gray-400 block mt-1 text-left">{new Date(m.created_at).toLocaleTimeString()}</span>
                       </div>

                       {/* AI Bubble */}
                       <div className="self-end max-w-[70%] bg-[#d9fdd3] rounded-lg rounded-tr-none p-3 shadow-sm">
                          <p className="text-sm text-gray-800">{m.ai_response}</p>
                          <span className="text-[10px] text-gray-500 block mt-1 text-right">{new Date(m.created_at).toLocaleTimeString()}</span>
                       </div>
                    </div>
                 ))}
              </div>
              
              {/* Input Area (Mock for now, could implement sending via WhatsApp API) */}
              <div className="p-4 bg-gray-100 border-t border-gray-200">
                 <input disabled placeholder="الرد المباشر قريبا..." className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white" />
              </div>
           </>
         ) : (
           <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl">💬</div>
              <p>اختر محادثة للبدء</p>
           </div>
         )}
      </div>
    </div>
  )
}
