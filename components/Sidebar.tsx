'use client'

import { createBrowserClient } from '@supabase/ssr'
import {
    BarChart,
    BrainCircuit,
    Calendar,
    Clock,
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
    ClipboardList,
    Video,
    Mic,
    Target,
    TrendingUp,
    Search,
    FileSearch,
    CalendarDays,
    Building2,
    User,
    Plus,
    Bot,
    Activity,
    Monitor,
    Workflow,
    MessageCircle,
    Zap,
    Smartphone,
    GitBranch
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

  // Define menu structure with categories
  // Structure: { category, name, href, icon, roles, badge? }
  const menuStructure = {
    // Admin only
    admin: [
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/admin', icon: LayoutDashboard, roles: ['admin'] },
      { category: 'التقارير', name: 'التقارير', href: '/dashboard/reports', icon: BarChart, roles: ['admin'] },
      { category: 'الإدارة', name: 'الأطباء', href: '/dashboard/doctors', icon: Users, roles: ['admin'] },
      { category: 'الإدارة', name: 'المستخدمين', href: '/dashboard/users', icon: Users, roles: ['admin'] },
      { category: 'الإدارة', name: 'المحتوى', href: '/dashboard/content', icon: FileText, roles: ['admin'] },
      { category: 'الإدارة', name: 'الذكاء الاصطناعي', href: '/dashboard/knowledge', icon: BrainCircuit, roles: ['admin'] },
      { category: 'الإدارة', name: 'الإعدادات', href: '/dashboard/admin/settings', icon: Settings, roles: ['admin'] },
    ],
    
    // Reception & Staff
    reception: [
      { category: 'الاستقبال', name: 'الاستقبال', href: '/dashboard/reception', icon: UserCheck, roles: ['admin', 'staff', 'reception'] },
      { category: 'التأمين', name: 'التأمينات', href: '/dashboard/insurance', icon: Shield, roles: ['admin', 'staff', 'insurance'] },
      { category: 'المالية', name: 'الفواتير', href: '/dashboard/billing', icon: DollarSign, roles: ['admin', 'staff', 'reception'] },
    ],

    // Doctor Module - Organized by categories
    doctor: [
      // 🏠 الرئيسية
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/doctor', icon: LayoutDashboard, roles: ['admin', 'doctor'] },
      
      // 👥 المرضى
      { category: 'المرضى', name: 'المريض الحالي', href: '/dashboard/doctor/current-patient', icon: User, roles: ['admin', 'doctor'] },
      { category: 'المرضى', name: 'قائمة المرضى', href: '/dashboard/doctor/patients', icon: Users, roles: ['admin', 'doctor'] },
      
      // 📅 الجدولة
      { category: 'الجدولة', name: 'الجدول الزمني', href: '/dashboard/doctor/schedule', icon: Calendar, roles: ['admin', 'doctor'] },
      { category: 'الجدولة', name: 'تخطيط أوقات العمل', href: '/dashboard/doctor/schedule/working-hours', icon: CalendarDays, roles: ['admin', 'doctor'] },
      { category: 'الجدولة', name: 'المواعيد', href: '/dashboard/doctor/appointments', icon: Clock, roles: ['admin', 'doctor'] },
      { category: 'الجدولة', name: 'طابور الاستقبال', href: '/dashboard/doctor/queue', icon: UserCheck, roles: ['admin', 'doctor'] },
      
      // 💼 الجلسات
      { category: 'الجلسات', name: 'قائمة الجلسات', href: '/dashboard/doctor/sessions', icon: ClipboardList, roles: ['admin', 'doctor'] },
      { category: 'الجلسات', name: 'جلسة جديدة', href: '/dashboard/doctor/sessions/new', icon: Plus, roles: ['admin', 'doctor'] },
      { category: 'الجلسات', name: 'الجلسات المرئية', href: '/dashboard/doctor/video-sessions', icon: Video, roles: ['admin', 'doctor'] },
      { category: 'الجلسات', name: 'التسجيلات', href: '/dashboard/doctor/recordings', icon: Mic, roles: ['admin', 'doctor'] },
      
      // 📋 العلاج والتخطيط
      { category: 'العلاج', name: 'خطط العلاج', href: '/dashboard/doctor/treatment-plans', icon: Target, roles: ['admin', 'doctor'] },
      { category: 'العلاج', name: 'السجلات الطبية', href: '/dashboard/doctor/medical-records', icon: FileText, roles: ['admin', 'doctor'] },
      { category: 'العلاج', name: 'تتبع التقدم', href: '/dashboard/doctor/progress', icon: TrendingUp, roles: ['admin', 'doctor'] },
      
      // 🤖 الأتمتة
      { category: 'الأتمتة', name: 'المساعد الذكي', href: '/dashboard/doctor/ai-assistant', icon: Bot, roles: ['admin', 'doctor'] },
      { category: 'الأتمتة', name: 'قوالب الملاحظات', href: '/dashboard/doctor/templates', icon: FileText, roles: ['admin', 'doctor'] },
      { category: 'الأتمتة', name: 'التوثيق التلقائي', href: '/dashboard/doctor/auto-documentation', icon: Bot, roles: ['admin', 'doctor'] },
      
      // 📊 التقارير والتحليلات
      { category: 'التقارير', name: 'الأداء', href: '/dashboard/doctor/analytics', icon: Activity, roles: ['admin', 'doctor'] },
      { category: 'التقارير', name: 'التقارير', href: '/dashboard/doctor/reports', icon: FileSearch, roles: ['admin', 'doctor'] },
      { category: 'التقارير', name: 'البحث المتقدم', href: '/dashboard/doctor/search', icon: Search, roles: ['admin', 'doctor'] },
      
      // 🛡️ التأمين
      { category: 'التأمين', name: 'المساعد الذكي للتأمين', href: '/dashboard/doctor/insurance/ai-agent', icon: Bot, roles: ['admin', 'doctor'] },
      { category: 'التأمين', name: 'مطالبات التأمين', href: '/dashboard/doctor/insurance/claims', icon: Shield, roles: ['admin', 'doctor'] },
      
      // ⚙️ الإعدادات
      { category: 'الإعدادات', name: 'بروفايلي', href: '/dashboard/doctor/settings', icon: User, roles: ['admin', 'doctor'] },
      { category: 'الإعدادات', name: 'إعدادات العيادة', href: '/dashboard/doctor/settings/clinic', icon: Building2, roles: ['admin', 'doctor'] },
      { category: 'الإعدادات', name: 'إعدادات الجلسات المرئية', href: '/dashboard/doctor/video-sessions/settings', icon: Monitor, roles: ['admin', 'doctor'] },
    ],

    // Shared pages
    shared: [
      { category: 'مشترك', name: 'التقويم', href: '/dashboard/calendar', icon: Calendar, roles: ['admin', 'doctor', 'staff', 'reception'] },
      { category: 'مشترك', name: 'المحادثات', href: '/dashboard/chat', icon: MessageSquare, roles: ['admin', 'doctor'] },
    ],
  }

  // Flatten and filter menu items based on user role
  const allMenuItems = [
    ...menuStructure.admin,
    ...menuStructure.reception,
    ...menuStructure.doctor,
    ...menuStructure.shared,
  ]

  // Filter by role
  const menuItems = userRole 
    ? allMenuItems.filter(item => item.roles.includes(userRole))
    : allMenuItems

  // Group by category for better organization
  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

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

      <nav className="flex-1 px-4 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-3 text-sm text-gray-500">جاري التحميل...</div>
        ) : (
          Object.entries(groupedMenu).map(([category, items]) => (
            <div key={category} className="space-y-1">
              {/* Category Header */}
              <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {category}
              </div>
              
              {/* Category Items */}
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon size={18} />
                    <span className="flex-1">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          ))
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
