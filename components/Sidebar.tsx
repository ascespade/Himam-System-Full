'use client'

import { createBrowserClient } from '@supabase/ssr'
import {
    BarChart,
    BrainCircuit,
    Calendar,
    DollarSign,
    FileText,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Settings,
    Shield,
    Stethoscope,
    UserCheck,
    Users,
    ClipboardList
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setUserRole(null)
        setLoading(false)
        return
      }

      // Fetch user role from users table
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (roleError) {
        console.error('Error fetching user role:', roleError)
        setUserRole('admin') // Fallback to admin
      } else {
        setUserRole(userData?.role || 'admin')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('admin') // Fallback to admin
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Define all menu items with their allowed roles
  // Roles: admin, doctor, staff, patient, reception, insurance
  const allMenuItems = [
    // Admin only pages
    { name: 'الرئيسية', href: '/dashboard/admin', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'التقارير', href: '/dashboard/reports', icon: BarChart, roles: ['admin'] },
    { name: 'الأطباء', href: '/dashboard/doctors', icon: Users, roles: ['admin'] },
    { name: 'المستخدمين', href: '/dashboard/users', icon: Users, roles: ['admin'] },
    { name: 'المحتوى', href: '/dashboard/content', icon: FileText, roles: ['admin'] },
    { name: 'الذكاء الاصطناعي', href: '/dashboard/knowledge', icon: BrainCircuit, roles: ['admin'] },
    { name: 'الإعدادات', href: '/dashboard/admin/settings', icon: Settings, roles: ['admin'] },
    
    // Reception & Staff pages
    { name: 'الاستقبال', href: '/dashboard/reception', icon: UserCheck, roles: ['admin', 'staff', 'reception'] },
    { name: 'التأمينات', href: '/dashboard/insurance', icon: Shield, roles: ['admin', 'staff', 'insurance'] },
    { name: 'الفواتير', href: '/dashboard/billing', icon: DollarSign, roles: ['admin', 'staff', 'reception'] },
    
    // Doctor pages (organized for doctor role)
    { name: 'شاشة الطبيب', href: '/dashboard/doctor', icon: Stethoscope, roles: ['admin', 'doctor'] },
    { name: 'الجلسات', href: '/dashboard/doctor/sessions', icon: ClipboardList, roles: ['admin', 'doctor'] },
    { name: 'خطط العلاج', href: '/dashboard/doctor/treatment-plans', icon: FileText, roles: ['admin', 'doctor'] },
    { name: 'الجدول الزمني', href: '/dashboard/doctor/schedule', icon: Calendar, roles: ['admin', 'doctor'] },
    { name: 'إعداداتي', href: '/dashboard/doctor/settings', icon: Settings, roles: ['admin', 'doctor'] },
    
    // Shared pages
    { name: 'التقويم', href: '/dashboard/calendar', icon: Calendar, roles: ['admin', 'doctor', 'staff', 'reception'] },
    { name: 'المحادثات', href: '/dashboard/chat', icon: MessageSquare, roles: ['admin', 'doctor'] },
  ]

  // Filter menu items based on user role
  const menuItems = userRole 
    ? allMenuItems.filter(item => item.roles.includes(userRole))
    : allMenuItems // Show all if role not loaded yet (fallback)

  return (
    <aside className="w-64 bg-white border-l border-gray-100 h-screen fixed right-0 top-0 flex flex-col shadow-sm z-30 hidden md:flex">
      <div className="p-6 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
          H
        </div>
        <div>
           <h1 className="font-bold text-lg text-gray-900">مركز الهمم</h1>
           <p className="text-xs text-gray-400">لوحة التحكم</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {loading ? (
          <div className="px-4 py-3 text-sm text-gray-500">جاري التحميل...</div>
        ) : (
          menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            )
          })
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut size={20} />
          تسجيل خروج
        </button>
      </div>
    </aside>
  )
}
