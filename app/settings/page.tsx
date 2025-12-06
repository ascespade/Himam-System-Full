'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface SystemSetting {
  key: string
  value: string
  description?: string
}

// Minimal Icons Component
const Icons = {
  Copy: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
    </svg>
  ),
  Paste: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  Eye: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  EyeOff: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ),
  Check: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  Trash: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  Info: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'ai', label: 'AI Models' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'google', label: 'Google Services' },
  { id: 'crm', label: 'CRM Integration' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState('ai') // Default to AI mostly used
  const [origin, setOrigin] = useState('')
  
  const pasteRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({})

  useEffect(() => {
    loadSettings()
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '')
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      const data = await response.json()

      if (data.success && data.data) {
        const settingsList = Array.isArray(data.data) ? data.data : []
        
        // Filter out internals
        const cleanSettings = settingsList.filter((s: SystemSetting) => 
           !s.key.startsWith('features.') && !s.key.startsWith('license.') && !s.key.startsWith('ui.') && !s.key.startsWith('userManagement.')
        )

        setSettings(cleanSettings)
        
        const initialForm: Record<string, string> = {}
        const initialVisible: Record<string, boolean> = {}
        cleanSettings.forEach((s: SystemSetting) => {
          initialForm[s.key] = s.value || ''
          initialVisible[s.key] = !isPasswordField(s.key)
        })
        setFormData(initialForm)
        setVisibleFields(initialVisible)
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Settings updated successfully')
        await loadSettings()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message || 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const isPasswordField = (key: string) => key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')

  // Helpers
  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const handlePaste = async (key: string) => {
    try {
      const text = await navigator.clipboard.readText()
      setFormData(prev => ({ ...prev, [key]: text }))
    } catch (e) { console.error(e) }
  }

  const toggleVisibility = (key: string) => setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }))

  // Grouping
  const getCategoryFields = (cat: string) => {
    return settings.filter(s => {
      const k = s.key
      if (cat === 'ai') return k.includes('GEMINI') || k.includes('OPENAI')
      if (cat === 'whatsapp') return k.includes('WHATSAPP')
      if (cat === 'google') return k.includes('GOOGLE')
      if (cat === 'crm') return k.includes('CRM')
      if (cat === 'general') return !k.includes('GEMINI') && !k.includes('OPENAI') && !k.includes('WHATSAPP') && !k.includes('GOOGLE') && !k.includes('CRM')
      return false
    })
  }

  const renderField = (setting: SystemSetting) => {
    const key = setting.key
    const value = formData[key] || ''
    const isPass = isPasswordField(key)
    const isVisible = visibleFields[key]
    const isTextarea = key.includes('PRIVATE_KEY')

    return (
      <div key={key} className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
           {key.replace(/_/g, ' ')}
        </label>
        <div className="relative group">
          {isTextarea ? (
             <textarea
                value={value}
                onChange={e => setFormData({...formData, [key]: e.target.value})}
                rows={4}
                className="block w-full rounded-lg border-0 bg-gray-50 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:bg-white transition-all font-mono text-sm"
             />
          ) : (
             <input 
                type={isPass && !isVisible ? 'password' : 'text'}
                value={value}
                onChange={e => setFormData({...formData, [key]: e.target.value})}
                className="block w-full rounded-lg border-0 bg-gray-50 py-3 px-4 pr-32 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:bg-white transition-all font-mono text-sm h-12"
             />
          )}

          {/* Action Icons */}
          <div className="absolute right-2 top-2 h-8 flex items-center gap-1 bg-white/0 group-focus-within:bg-white/0 transition-colors rounded">
             {isPass && (
               <button type="button" onClick={() => toggleVisibility(key)} className="p-1.5 text-gray-400 hover:text-black rounded transition-colors" title="Toggle View">
                 {isVisible ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
               </button>
             )}
             <button type="button" onClick={() => handleCopy(key, value)} className="p-1.5 text-gray-400 hover:text-black rounded transition-colors" title="Copy">
                 {copiedField === key ? <Icons.Check className="w-4 h-4 text-green-600" /> : <Icons.Copy className="w-4 h-4" />}
             </button>
             <button type="button" onClick={() => handlePaste(key)} className="p-1.5 text-gray-400 hover:text-black rounded transition-colors" title="Paste">
                 <Icons.Paste className="w-4 h-4" />
             </button>
          </div>
        </div>
        {setting.description && (
          <p className="mt-1.5 text-xs text-gray-400">{setting.description}</p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
         <main className="max-w-4xl mx-auto py-12 px-6">
             <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-100 w-1/4 rounded"></div>
                <div className="h-64 bg-gray-50 rounded-xl"></div>
             </div>
         </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />
      
      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="flex justify-between items-end mb-8">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-black mb-2">System Configuration</h1>
             <p className="text-gray-500">Manage API keys, integrations, and environment variables.</p>
           </div>
           
           {/* Global Actions */}
           <button 
             onClick={handleSubmit} 
             disabled={saving}
             className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
           >
             {saving ? 'Saving...' : 'Save Changes'}
           </button>
        </div>

        {error && (
           <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-600"></div>
             {error}
           </div>
        )}

        {success && (
           <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-600"></div>
             {success}
           </div>
        )}

        {/* Modern Tabs */}
        <div className="mb-8 border-b border-gray-100">
          <nav className="flex space-x-8" aria-label="Tabs">
            {TABS.map((tab) => {
               const isActive = activeTab === tab.id
               const count = getCategoryFields(tab.id).length
               if (count === 0 && tab.id !== 'whatsapp') return null 

               return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-all
                    ${isActive 
                      ? 'border-black text-black' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                    }
                  `}
                >
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                </button>
               )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl min-h-[400px]">
           
           {/* Special Section: Webhook URL for WhatsApp Tab */}
           {activeTab === 'whatsapp' && (
              <div className="mb-10 bg-gray-50 border border-gray-100 rounded-xl p-6">
                 <div className="flex items-center gap-2 mb-4 text-gray-900">
                    <Icons.Info className="w-4 h-4" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Webhook Endpoint</h3>
                 </div>
                 
                 <div className="text-sm text-gray-500 mb-4">
                    Copy the URL below and paste it into your Meta Developer Console to receive messages.
                 </div>

                 <div className="flex items-center">
                    <div className="flex-1 font-mono text-sm bg-white border border-gray-200 text-gray-600 px-4 py-3 rounded-l-lg truncate">
                       {origin ? `${origin}/api/whatsapp` : '/api/whatsapp'}
                    </div>
                    <button
                       onClick={() => handleCopy('webhook_url', origin ? `${origin}/api/whatsapp` : '')}
                       className="bg-white border border-l-0 border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-3 rounded-r-lg font-medium text-sm transition-colors border-l"
                    >
                       {copiedField === 'webhook_url' ? 'Copied' : 'Copy'}
                    </button>
                 </div>
              </div>
           )}

           {/* Settings Fields */}
           <div className="space-y-1">
              {getCategoryFields(activeTab).length === 0 ? (
                 <div className="text-center py-20 text-gray-400 text-sm">
                    No settings available in this category.
                 </div>
              ) : (
                 getCategoryFields(activeTab).map(setting => renderField(setting))
              )}
           </div>

        </div>

      </main>

      <Footer />
    </div>
  )
}
