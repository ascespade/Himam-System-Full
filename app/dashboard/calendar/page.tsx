'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, useCallback } from 'react'
import AdminCalendar from '@/components/AdminCalendar'

export default function CalendarPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchUserRole = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setLoading(false)
        return
      }

      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (roleError) {
        console.error('Error fetching user role:', roleError)
        setUserRole('admin')
      } else {
        setUserRole(userData?.role || 'admin')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('admin')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUserRole()
  }, [fetchUserRole])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل التقويم...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">جدول المواعيد</h1>
    </div>
  )
}
