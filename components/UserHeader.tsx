'use client'

import { createBrowserClient } from '@supabase/ssr'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserInfo {
  id: string
  name: string
  email: string
  role: string
}

export default function UserHeader() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setUserInfo(null)
        setLoading(false)
        return
      }

      // Fetch user info from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user info:', userError)
        // Fallback to auth user data
        setUserInfo({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'admin'
        })
      } else {
        setUserInfo({
          id: userData.id,
          name: userData.name || user.email?.split('@')[0] || 'User',
          email: userData.email || user.email || '',
          role: userData.role || 'admin'
        })
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Get user's initial for avatar
  const getInitial = (name: string): string => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // Role labels in Arabic
  const roleLabels: Record<string, string> = {
    admin: 'مدير',
    doctor: 'طبيب',
    staff: 'موظف',
    patient: 'مريض',
    reception: 'استقبال',
    insurance: 'تأمين'
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!userInfo) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
          {getInitial(userInfo.name)}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">{userInfo.name}</span>
          <span className="text-xs text-gray-500">{roleLabels[userInfo.role] || userInfo.role}</span>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
      >
        <LogOut size={16} />
        <span>تسجيل خروج</span>
      </button>
    </div>
  )
}

