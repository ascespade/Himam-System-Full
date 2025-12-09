'use client'

import { useState, useRef, useEffect } from 'react'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'مرحباً بك في مركز الهمم! كيف يمكنني مساعدتك اليوم؟' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = input
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await res.json()
      
      if (data.success) {
        // Clean response same as WhatsApp
        const cleanText = data.response.replace(/\[BOOKING_READY\][\s\S]*?}/g, '').trim()
        setMessages(prev => [...prev, { role: 'bot', text: cleanText }])
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'عذراً، حدث خطأ ما. يرجى المحاولة لاحقاً.' }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'خطأ في الاتصال.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4" dir="rtl">
      {/* Search/Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 md:w-96 h-[500px] flex flex-col overflow-hidden animate-scale-in">
           {/* Header */}
           <div className="bg-primary p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    🤖
                 </div>
                 <div>
                    <h3 className="font-bold text-sm">المساعد الذكي</h3>
                    <p className="text-xs text-white/80">متاح للمساعدة الفورية</p>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                 </svg>
              </button>
           </div>

           {/* Messages */}
           <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                       msg.role === 'user' 
                       ? 'bg-primary text-white rounded-bl-none' 
                       : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-br-none'
                    }`}>
                       {msg.text}
                    </div>
                 </div>
              ))}
              {loading && (
                 <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-br-none shadow-sm flex gap-1">
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           {/* Input */}
           <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                 <input 
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                   placeholder="اكتب رسالتك..."
                 />
                 <button 
                   type="submit" 
                   disabled={loading || !input.trim()}
                   className="bg-primary text-white p-2 rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                       <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* Launcher Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
      >
        {isOpen ? (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
        ) : (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
           </svg>
        )}
      </button>
    </div>
  )
}
