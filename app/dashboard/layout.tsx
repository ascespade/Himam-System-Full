'use client'

import Sidebar from '@/components/Sidebar'
// import NotificationsMenu from '@/components/NotificationsMenu' // TODO: Re-implement
// import UserHeader from '@/components/UserHeader' // TODO: Re-implement
// import DoctorHeader from '@/components/DoctorHeader' // TODO: Re-implement
// import { Toaster } from 'sonner' // TODO: Install sonner package
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
          <header className="bg-white border-b border-gray-100 min-h-16 flex items-center px-4 md:px-8 sticky top-0 z-20 shadow-sm">
            <div className="w-full flex items-center gap-4">
              {/* TODO: Re-implement NotificationsMenu, UserHeader, DoctorHeader */}
              <div className="flex-1"></div>
              {!loading && userRole && (
                <div className="text-sm text-gray-600">
                  {userRole === 'doctor' ? 'طبيب' : 
                   userRole === 'admin' ? 'مدير' :
                   userRole === 'reception' ? 'استقبال' :
                   userRole === 'patient' ? 'مريض' :
                   userRole === 'guardian' ? 'ولي أمر' :
                   userRole === 'supervisor' ? 'مشرف' : userRole}
                </div>
              )}
            </div>
          </header>
          {children}
       </div>
       {/* <Toaster position="top-center" richColors /> TODO: Install sonner package */}
    </div>
  )
}
