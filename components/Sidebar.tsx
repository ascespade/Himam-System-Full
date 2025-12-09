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
    GitBranch,
    AlertCircle,
    FlaskConical,
    Pill
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
    try {
      await supabase.auth.signOut()
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      // Redirect to login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error during logout:', error)
      // Force redirect even if signOut fails
      router.push('/login')
      router.refresh()
    }
  }

  // Define menu structure with categories
  // Structure: { category, name, href, icon, roles, badge? }
  const menuStructure = {
    // Admin only - NO other module dashboards
    admin: [
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/admin', icon: LayoutDashboard, roles: ['admin'] },
      { category: 'التقارير', name: 'التقارير', href: '/dashboard/reports', icon: BarChart, roles: ['admin'] },
      { category: 'الإدارة', name: 'الأطباء', href: '/dashboard/doctors', icon: Users, roles: ['admin'] },
      { category: 'الإدارة', name: 'المستخدمين', href: '/dashboard/users', icon: Users, roles: ['admin'] },
      { category: 'الإدارة', name: 'المحتوى', href: '/dashboard/content', icon: FileText, roles: ['admin'] },
      { category: 'الإدارة', name: 'الذكاء الاصطناعي', href: '/dashboard/knowledge', icon: BrainCircuit, roles: ['admin'] },
      { category: 'واتساب', name: 'واتساب', href: '/dashboard/admin/whatsapp', icon: Smartphone, roles: ['admin'] },
      { category: 'واتساب', name: 'القوالب', href: '/dashboard/admin/whatsapp/templates', icon: FileText, roles: ['admin'] },
      { category: 'واتساب', name: 'الملف الشخصي', href: '/dashboard/admin/whatsapp/profile', icon: User, roles: ['admin'] },
      { category: 'واتساب', name: 'البث المباشر', href: '/dashboard/admin/whatsapp/live', icon: MessageCircle, roles: ['admin'] },
      { category: 'واتساب', name: 'التحليلات', href: '/dashboard/admin/whatsapp/analytics', icon: BarChart, roles: ['admin'] },
      { category: 'الأتمتة', name: 'التدفقات', href: '/dashboard/admin/workflows', icon: Workflow, roles: ['admin'] },
      { category: 'الأتمتة', name: 'مراقبة النظام', href: '/dashboard/admin/monitor', icon: Monitor, roles: ['admin'] },
      { category: 'الإعدادات', name: 'الإعدادات', href: '/dashboard/admin/settings', icon: Settings, roles: ['admin'] },
    ],
    
    // Reception & Staff Module - NO admin access to dashboards
    reception: [
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/reception', icon: LayoutDashboard, roles: ['staff', 'reception'] },
      { category: 'الطابور', name: 'طابور الاستقبال', href: '/dashboard/reception/queue', icon: UserCheck, roles: ['staff', 'reception'] },
      { category: 'المرضى', name: 'إدارة المرضى', href: '/dashboard/reception/patients', icon: Users, roles: ['staff', 'reception'] },
      { category: 'المرضى', name: 'إضافة مريض جديد', href: '/dashboard/reception/patients/new', icon: Plus, roles: ['staff', 'reception'] },
      { category: 'المواعيد', name: 'إدارة المواعيد', href: '/dashboard/reception/appointments', icon: Calendar, roles: ['staff', 'reception'] },
      { category: 'المواعيد', name: 'حجز موعد', href: '/dashboard/reception/book-appointment', icon: Calendar, roles: ['staff', 'reception'] },
      { category: 'المالية', name: 'الفواتير والمدفوعات', href: '/dashboard/reception/billing', icon: DollarSign, roles: ['staff', 'reception'] },
      { category: 'التأمين', name: 'إدارة التأمين', href: '/dashboard/reception/insurance', icon: Shield, roles: ['staff', 'reception'] },
      { category: 'التقارير', name: 'التقارير', href: '/dashboard/reception/reports', icon: BarChart, roles: ['staff', 'reception'] },
      { category: 'الإعدادات', name: 'إعدادات الاستقبال', href: '/dashboard/reception/settings', icon: Settings, roles: ['staff', 'reception'] },
    ],

    // Doctor Module - Organized by categories - NO admin access to dashboard
    doctor: [
      // 🏠 الرئيسية
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/doctor', icon: LayoutDashboard, roles: ['doctor'] },
      
      // 👥 المرضى
      { category: 'المرضى', name: 'المريض الحالي', href: '/dashboard/doctor/current-patient', icon: User, roles: ['doctor'] },
      { category: 'المرضى', name: 'قائمة المرضى', href: '/dashboard/doctor/patients', icon: Users, roles: ['doctor'] },
      
      // 📅 الجدولة
      { category: 'الجدولة', name: 'الجدول الزمني', href: '/dashboard/doctor/schedule', icon: Calendar, roles: ['doctor'] },
      { category: 'الجدولة', name: 'تخطيط أوقات العمل', href: '/dashboard/doctor/schedule/working-hours', icon: CalendarDays, roles: ['doctor'] },
      { category: 'الجدولة', name: 'المواعيد', href: '/dashboard/doctor/appointments', icon: Clock, roles: ['doctor'] },
      { category: 'الجدولة', name: 'طابور الاستقبال', href: '/dashboard/doctor/queue', icon: UserCheck, roles: ['doctor'] },
      
      // 💼 الجلسات
      { category: 'الجلسات', name: 'قائمة الجلسات', href: '/dashboard/doctor/sessions', icon: ClipboardList, roles: ['doctor'] },
      { category: 'الجلسات', name: 'جلسة جديدة', href: '/dashboard/doctor/sessions/new', icon: Plus, roles: ['doctor'] },
      { category: 'الجلسات', name: 'الجلسات المرئية', href: '/dashboard/doctor/video-sessions', icon: Video, roles: ['doctor'] },
      { category: 'الجلسات', name: 'التسجيلات', href: '/dashboard/doctor/recordings', icon: Mic, roles: ['doctor'] },
      
      // 📋 العلاج والتخطيط
      { category: 'العلاج', name: 'خطط العلاج', href: '/dashboard/doctor/treatment-plans', icon: Target, roles: ['doctor'] },
      { category: 'العلاج', name: 'السجلات الطبية', href: '/dashboard/doctor/medical-records', icon: FileText, roles: ['doctor'] },
      { category: 'العلاج', name: 'تتبع التقدم', href: '/dashboard/doctor/progress', icon: TrendingUp, roles: ['doctor'] },
      
      // 🤖 الأتمتة
      { category: 'الأتمتة', name: 'المساعد الذكي', href: '/dashboard/doctor/ai-assistant', icon: Bot, roles: ['doctor'] },
      { category: 'الأتمتة', name: 'قوالب الملاحظات', href: '/dashboard/doctor/templates', icon: FileText, roles: ['doctor'] },
      { category: 'الأتمتة', name: 'التوثيق التلقائي', href: '/dashboard/doctor/auto-documentation', icon: Bot, roles: ['doctor'] },
      
      // 📊 التقارير والتحليلات
      { category: 'التقارير', name: 'الأداء', href: '/dashboard/doctor/analytics', icon: Activity, roles: ['doctor'] },
      { category: 'التقارير', name: 'التقارير', href: '/dashboard/doctor/reports', icon: FileSearch, roles: ['doctor'] },
      { category: 'التقارير', name: 'البحث المتقدم', href: '/dashboard/doctor/search', icon: Search, roles: ['doctor'] },
      
      // 🛡️ التأمين
      { category: 'التأمين', name: 'المساعد الذكي للتأمين', href: '/dashboard/doctor/insurance/ai-agent', icon: Bot, roles: ['doctor'] },
      { category: 'التأمين', name: 'مطالبات التأمين', href: '/dashboard/doctor/insurance/claims', icon: Shield, roles: ['doctor'] },
      
      // ⚙️ الإعدادات
      { category: 'الإعدادات', name: 'بروفايلي', href: '/dashboard/doctor/settings', icon: User, roles: ['doctor'] },
      { category: 'الإعدادات', name: 'إعدادات العيادة', href: '/dashboard/doctor/settings/clinic', icon: Building2, roles: ['doctor'] },
      { category: 'الإعدادات', name: 'إعدادات الجلسات المرئية', href: '/dashboard/doctor/video-sessions/settings', icon: Monitor, roles: ['doctor'] },
    ],

    // Patient Module
    patient: [
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/patient', icon: LayoutDashboard, roles: ['patient'] },
      { category: 'المواعيد', name: 'مواعيدي', href: '/dashboard/patient/appointments', icon: Calendar, roles: ['patient'] },
      { category: 'السجلات', name: 'السجلات الطبية', href: '/dashboard/patient/records', icon: FileText, roles: ['patient'] },
      { category: 'الأدوية', name: 'الأدوية', href: '/dashboard/patient/medications', icon: Activity, roles: ['patient'] },
      { category: 'الأدوية', name: 'الوصفات الطبية', href: '/dashboard/patient/prescriptions', icon: FileText, roles: ['patient'] },
      { category: 'التحاليل', name: 'نتائج التحاليل', href: '/dashboard/patient/lab-results', icon: Activity, roles: ['patient'] },
      { category: 'العلاج', name: 'خطط العلاج', href: '/dashboard/patient/treatment-plans', icon: Target, roles: ['patient'] },
      { category: 'العلاج', name: 'تتبع التقدم', href: '/dashboard/patient/progress', icon: TrendingUp, roles: ['patient'] },
      { category: 'المستندات', name: 'المستندات', href: '/dashboard/patient/documents', icon: FileText, roles: ['patient'] },
      { category: 'المالية', name: 'الفواتير والمدفوعات', href: '/dashboard/patient/billing', icon: DollarSign, roles: ['patient'] },
      { category: 'الإعدادات', name: 'الإعدادات', href: '/dashboard/patient/settings', icon: Settings, roles: ['patient'] },
    ],

    // Guardian Module
    guardian: [
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/guardian', icon: LayoutDashboard, roles: ['guardian'] },
      { category: 'المرضى', name: 'المرضى المرتبطين', href: '/dashboard/guardian/patients', icon: Users, roles: ['guardian'] },
      { category: 'الموافقات', name: 'الموافقات المعلقة', href: '/dashboard/guardian/approvals', icon: UserCheck, roles: ['guardian'] },
    ],

    // Supervisor Module
    supervisor: [
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/supervisor', icon: LayoutDashboard, roles: ['supervisor'] },
      { category: 'المراجعات', name: 'مراجعات الجلسات', href: '/dashboard/supervisor/reviews', icon: FileText, roles: ['supervisor'] },
      { category: 'الجودة', name: 'تحليلات الجودة', href: '/dashboard/supervisor/quality', icon: TrendingUp, roles: ['supervisor'] },
      { category: 'الحالات', name: 'الحالات الحرجة', href: '/dashboard/supervisor/critical-cases', icon: AlertCircle, roles: ['supervisor'] },
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
    ...menuStructure.patient,
    ...menuStructure.guardian,
    ...menuStructure.supervisor,
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
    <aside className="w-64 bg-white border-l border-gray-100 h-screen fixed right-0 top-0 flex flex-col shadow-sm z-50 hidden md:flex">
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
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer relative z-10 ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={(e) => {
                      // Force navigation using router to ensure it works
                      e.preventDefault()
                      router.push(item.href)
                    }}
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
