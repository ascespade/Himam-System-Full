'use client'

import NotificationsMenu from '@/components/NotificationsMenu'
import Sidebar from '@/components/Sidebar'
import UserHeader from '@/components/UserHeader'
import DoctorHeader from '@/components/DoctorHeader'
import { Toaster } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          setUserRole(userData?.role || null)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRole()
  }, [supabase])

  return (
    <div className="min-h-screen bg-[#FAFAFA]" dir="rtl">
       <Sidebar />
       <div className="md:mr-64 min-h-screen transition-all duration-300">
          <header className="bg-white border-b border-gray-100 min-h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
            <div className="w-full flex items-center justify-between gap-4">
              {!loading && userRole === 'doctor' ? (
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <NotificationsMenu />
                    <DoctorHeader />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <NotificationsMenu />
                    <UserHeader />
                  </div>
                </>
              )}
            </div>
          </header>
          {children}
       </div>
       <Toaster position="top-center" richColors />
    </div>
  )
}
