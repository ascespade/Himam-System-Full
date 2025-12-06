'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export default function WhatsAppSimulatorPage() {
  const [phoneNumber, setPhoneNumber] = useState('966500000000')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    }

    setHistory(prev => [...prev, userMsg])
    setLoading(true)
    setMessage('')

    try {
      // Mock the webhook payload
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: phoneNumber,
                id: uuidv4(),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: 'text',
                text: { body: userMsg.content }
              }]
            }
          }]
        }]
      }

      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.data?.aiResponse) {
        const aiMsg: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: data.data.aiResponse,
          timestamp: new Date().toLocaleTimeString()
        }
        setHistory(prev => [...prev, aiMsg])
      } else {
         const sysMsg: Message = {
          id: uuidv4(),
          role: 'system',
          content: `Response Status: ${response.status} (Check logs for details)`,
          timestamp: new Date().toLocaleTimeString()
        }
        setHistory(prev => [...prev, sysMsg])
      }

    } catch (error: any) {
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }
      setHistory(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">WhatsApp Chatbot Simulator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="font-semibold mb-4 text-gray-700">Simulation Settings</h2>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Test Phone Number</label>
            <input 
              type="text" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <button 
            onClick={() => setHistory([])}
            className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
          >
            Clear History
          </button>
        </div>

        {/* Chat Interface */}
        <div className="md:col-span-2 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <p>Start a conversation to test the bot.</p>
                <p className="text-sm mt-2">Try sending "Hi" or "Book appointment"</p>
              </div>
            )}
            {history.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white rounded-br-none' 
                      : msg.role === 'system'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 mx-1">{msg.timestamp}</span>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm border border-gray-200">
                  <div className="flex space-x-1 space-x-reverse">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white p-4 border-t border-gray-200">
            <div className="flex space-x-2 space-x-reverse">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !message.trim()}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
