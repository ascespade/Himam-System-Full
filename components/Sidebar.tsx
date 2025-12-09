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
<<<<<<< HEAD
    Monitor
=======
    Monitor,
    Workflow,
    MessageCircle,
    Zap,
    Smartphone,
    GitBranch
>>>>>>> cursor/fix-code-errors-and-warnings-8041
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

<<<<<<< HEAD
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
=======
  // Define menu structure with categories and priority for smart grouping
  // Structure: { category, name, href, icon, roles, priority, badge? }
  // Priority: 1 = highest (always visible), 2 = high, 3 = medium, 4 = low
  const menuStructure = {
    // Admin Module - Organized by modules with smart grouping
    admin: [
      // 🏠 الرئيسية (Priority 1)
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/admin', icon: LayoutDashboard, roles: ['admin'], priority: 1 },
      { category: 'الرئيسية', name: 'المراقبة', href: '/dashboard/admin/monitor', icon: Monitor, roles: ['admin'], priority: 1 },
      
      // 📱 الواتساب (Priority 1)
      { category: 'الواتساب', name: 'بروفايل الأعمال', href: '/dashboard/admin/whatsapp/profile', icon: Building2, roles: ['admin'], priority: 1 },
      { category: 'الواتساب', name: 'قوالب الرسائل', href: '/dashboard/admin/whatsapp/templates', icon: FileText, roles: ['admin'], priority: 1 },
      { category: 'الواتساب', name: 'المحادثات المباشرة', href: '/dashboard/admin/whatsapp/live', icon: MessageSquare, roles: ['admin'], priority: 1 },
      { category: 'الواتساب', name: 'التحليلات', href: '/dashboard/admin/whatsapp/analytics', icon: BarChart, roles: ['admin'], priority: 2 },
      
      // 🔄 الأتمتة (Priority 1)
      { category: 'الأتمتة', name: 'التدفقات', href: '/dashboard/admin/workflows', icon: GitBranch, roles: ['admin'], priority: 1 },
      
      // ⚙️ القواعد والإعدادات (Priority 2)
      { category: 'القواعد', name: 'قواعد العمل', href: '/dashboard/admin/business-rules', icon: Shield, roles: ['admin'], priority: 2 },
      { category: 'القواعد', name: 'الإعدادات', href: '/dashboard/admin/settings', icon: Settings, roles: ['admin'], priority: 2 },
      
      // 📊 التقارير (Priority 3)
      { category: 'التقارير', name: 'التقارير', href: '/dashboard/reports', icon: BarChart, roles: ['admin'], priority: 3 },
    ],
    
    // Reception Module - Organized by categories
    reception: [
      // 🏠 الرئيسية
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/reception', icon: LayoutDashboard, roles: ['admin', 'reception'], priority: 1 },
      
      // 👥 المرضى
      { category: 'المرضى', name: 'قائمة المرضى', href: '/dashboard/reception/patients', icon: Users, roles: ['admin', 'reception'], priority: 1 },
      { category: 'المرضى', name: 'تسجيل مريض جديد', href: '/dashboard/reception/patients/new', icon: Plus, roles: ['admin', 'reception'], priority: 2 },
      
      // 📋 الطابور
      { category: 'الطابور', name: 'إدارة الطابور', href: '/dashboard/reception/queue', icon: UserCheck, roles: ['admin', 'reception'], priority: 1 },
      
      // 📅 المواعيد
      { category: 'المواعيد', name: 'حجز موعد', href: '/dashboard/reception/book-appointment', icon: Calendar, roles: ['admin', 'reception'], priority: 2 },
      
      // 💰 المالية
      { category: 'المالية', name: 'الفواتير', href: '/dashboard/billing', icon: DollarSign, roles: ['admin', 'reception'], priority: 3 },
    ],

    // Guardian Module
    guardian: [
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/guardian', icon: LayoutDashboard, roles: ['guardian'], priority: 1 },
      { category: 'المرضى', name: 'قائمة المرضى', href: '/dashboard/guardian/patients', icon: Users, roles: ['guardian'], priority: 1 },
      { category: 'الموافقات', name: 'الموافقات المعلقة', href: '/dashboard/guardian/approvals', icon: UserCheck, roles: ['guardian'], priority: 2 },
    ],

    // Supervisor Module
    supervisor: [
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/supervisor', icon: LayoutDashboard, roles: ['supervisor'], priority: 1 },
      { category: 'الحالات الحرجة', name: 'الحالات الحرجة', href: '/dashboard/supervisor/critical-cases', icon: Activity, roles: ['supervisor'], priority: 1 },
      { category: 'المراجعات', name: 'مراجعات الجلسات', href: '/dashboard/supervisor/reviews', icon: FileText, roles: ['supervisor'], priority: 2 },
      { category: 'الجودة', name: 'تحليلات الجودة', href: '/dashboard/supervisor/quality', icon: TrendingUp, roles: ['supervisor'], priority: 2 },
>>>>>>> cursor/fix-code-errors-and-warnings-8041
    ],

    // Doctor Module - Organized by categories
    doctor: [
      // 🏠 الرئيسية
<<<<<<< HEAD
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
=======
      { category: 'الرئيسية', name: 'لوحة التحكم', href: '/dashboard/doctor', icon: LayoutDashboard, roles: ['admin', 'doctor'], priority: 1 },
      
      // 👥 المرضى
      { category: 'المرضى', name: 'المريض الحالي', href: '/dashboard/doctor/current-patient', icon: User, roles: ['admin', 'doctor'], priority: 1 },
      { category: 'المرضى', name: 'قائمة المرضى', href: '/dashboard/doctor/patients', icon: Users, roles: ['admin', 'doctor'], priority: 2 },
      
      // 📅 الجدولة
      { category: 'الجدولة', name: 'الجدول الزمني', href: '/dashboard/doctor/schedule', icon: Calendar, roles: ['admin', 'doctor'], priority: 1 },
      { category: 'الجدولة', name: 'تخطيط أوقات العمل', href: '/dashboard/doctor/schedule/working-hours', icon: CalendarDays, roles: ['admin', 'doctor'], priority: 2 },
      { category: 'الجدولة', name: 'المواعيد', href: '/dashboard/doctor/appointments', icon: Clock, roles: ['admin', 'doctor'], priority: 1 },
      { category: 'الجدولة', name: 'طابور الاستقبال', href: '/dashboard/doctor/queue', icon: UserCheck, roles: ['admin', 'doctor'], priority: 2 },
      
      // 💼 الجلسات
      { category: 'الجلسات', name: 'قائمة الجلسات', href: '/dashboard/doctor/sessions', icon: ClipboardList, roles: ['admin', 'doctor'], priority: 1 },
      { category: 'الجلسات', name: 'جلسة جديدة', href: '/dashboard/doctor/sessions/new', icon: Plus, roles: ['admin', 'doctor'], priority: 2 },
      { category: 'الجلسات', name: 'الجلسات المرئية', href: '/dashboard/doctor/video-sessions', icon: Video, roles: ['admin', 'doctor'], priority: 2 },
      { category: 'الجلسات', name: 'التسجيلات', href: '/dashboard/doctor/recordings', icon: Mic, roles: ['admin', 'doctor'], priority: 3 },
      
      // 📋 العلاج والتخطيط
      { category: 'العلاج', name: 'خطط العلاج', href: '/dashboard/doctor/treatment-plans', icon: Target, roles: ['admin', 'doctor'], priority: 2 },
      { category: 'العلاج', name: 'السجلات الطبية', href: '/dashboard/doctor/medical-records', icon: FileText, roles: ['admin', 'doctor'], priority: 1 },
      { category: 'العلاج', name: 'تتبع التقدم', href: '/dashboard/doctor/progress', icon: TrendingUp, roles: ['admin', 'doctor'], priority: 3 },
      
      // 🤖 الأتمتة
      { category: 'الأتمتة', name: 'المساعد الذكي', href: '/dashboard/doctor/ai-assistant', icon: Bot, roles: ['admin', 'doctor'], priority: 2 },
      { category: 'الأتمتة', name: 'قوالب الملاحظات', href: '/dashboard/doctor/templates', icon: FileText, roles: ['admin', 'doctor'], priority: 3 },
      { category: 'الأتمتة', name: 'التوثيق التلقائي', href: '/dashboard/doctor/auto-documentation', icon: Bot, roles: ['admin', 'doctor'], priority: 3 },
      
      // 📊 التقارير والتحليلات
      { category: 'التقارير', name: 'الأداء', href: '/dashboard/doctor/analytics', icon: Activity, roles: ['admin', 'doctor'], priority: 2 },
      { category: 'التقارير', name: 'التقارير', href: '/dashboard/doctor/reports', icon: FileSearch, roles: ['admin', 'doctor'], priority: 3 },
      { category: 'التقارير', name: 'البحث المتقدم', href: '/dashboard/doctor/search', icon: Search, roles: ['admin', 'doctor'], priority: 3 },
      
      // 🛡️ التأمين
      { category: 'التأمين', name: 'المساعد الذكي للتأمين', href: '/dashboard/doctor/insurance/ai-agent', icon: Bot, roles: ['admin', 'doctor'], priority: 2 },
      { category: 'التأمين', name: 'مطالبات التأمين', href: '/dashboard/doctor/insurance/claims', icon: Shield, roles: ['admin', 'doctor'], priority: 1 },
      
      // ⚙️ الإعدادات
      { category: 'الإعدادات', name: 'بروفايلي', href: '/dashboard/doctor/settings', icon: User, roles: ['admin', 'doctor'], priority: 3 },
      { category: 'الإعدادات', name: 'إعدادات العيادة', href: '/dashboard/doctor/settings/clinic', icon: Building2, roles: ['admin', 'doctor'], priority: 3 },
      { category: 'الإعدادات', name: 'إعدادات الجلسات المرئية', href: '/dashboard/doctor/video-sessions/settings', icon: Monitor, roles: ['admin', 'doctor'], priority: 4 },
>>>>>>> cursor/fix-code-errors-and-warnings-8041
    ],

    // Shared pages
    shared: [
<<<<<<< HEAD
      { category: 'مشترك', name: 'التقويم', href: '/dashboard/calendar', icon: Calendar, roles: ['admin', 'doctor', 'staff', 'reception'] },
      { category: 'مشترك', name: 'المحادثات', href: '/dashboard/chat', icon: MessageSquare, roles: ['admin', 'doctor'] },
=======
      { category: 'مشترك', name: 'التقويم', href: '/dashboard/calendar', icon: Calendar, roles: ['admin', 'doctor', 'staff', 'reception'], priority: 2 },
      { category: 'مشترك', name: 'المحادثات', href: '/dashboard/chat', icon: MessageSquare, roles: ['admin', 'doctor'], priority: 3 },
>>>>>>> cursor/fix-code-errors-and-warnings-8041
    ],
  }

  // Flatten and filter menu items based on user role
  const allMenuItems = [
    ...menuStructure.admin,
    ...menuStructure.reception,
    ...menuStructure.doctor,
    ...menuStructure.shared,
  ]

<<<<<<< HEAD
  // Filter by role
  const menuItems = userRole 
    ? allMenuItems.filter(item => item.roles.includes(userRole))
    : allMenuItems

  // Group by category for better organization
=======
  // Filter by role with proper role mapping
  const menuItems = userRole 
    ? allMenuItems.filter(item => {
        // Map roles for better access control
        if (userRole === 'admin') {
          return item.roles.includes('admin') || item.roles.includes('doctor') || item.roles.includes('reception')
        }
        return item.roles.includes(userRole)
      })
    : allMenuItems

  // Smart grouping: Group by category and sort by priority
>>>>>>> cursor/fix-code-errors-and-warnings-8041
  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

<<<<<<< HEAD
=======
  // Sort categories by priority (lower priority number = higher importance)
  // Category priority = minimum priority of items in that category
  const categoryOrder = [
    'الرئيسية',
    'الواتساب',
    'الأتمتة',
    'المرضى',
    'الطابور',
    'المواعيد',
    'الجدولة',
    'الجلسات',
    'العلاج',
    'التأمين',
    'القواعد',
    'المالية',
    'التقارير',
    'الحالات الحرجة',
    'المراجعات',
    'الجودة',
    'الموافقات',
    'الإعدادات',
    'مشترك'
  ]

  // Sort items within each category by priority
  Object.keys(groupedMenu).forEach(category => {
    groupedMenu[category].sort((a, b) => (a.priority || 99) - (b.priority || 99))
  })

  // Create ordered categories array
  const orderedCategories = categoryOrder
    .filter(cat => groupedMenu[cat] && groupedMenu[cat].length > 0)
    .concat(Object.keys(groupedMenu).filter(cat => !categoryOrder.includes(cat)))

>>>>>>> cursor/fix-code-errors-and-warnings-8041
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

<<<<<<< HEAD
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
=======
      <nav className="flex-1 px-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-3 text-sm text-gray-500">جاري التحميل...</div>
        ) : (
          orderedCategories.map((category) => {
            const items = groupedMenu[category]
            if (!items || items.length === 0) return null

            // Category icons mapping for better visual hierarchy
            const categoryIcons: Record<string, any> = {
              'الرئيسية': LayoutDashboard,
              'الواتساب': Smartphone,
              'الأتمتة': GitBranch,
              'المرضى': Users,
              'الطابور': UserCheck,
              'المواعيد': Calendar,
              'الجدولة': CalendarDays,
              'الجلسات': ClipboardList,
              'العلاج': Target,
              'التأمين': Shield,
              'القواعد': Shield,
              'المالية': DollarSign,
              'التقارير': BarChart,
              'الحالات الحرجة': Activity,
              'المراجعات': FileText,
              'الجودة': TrendingUp,
              'الموافقات': UserCheck,
              'الإعدادات': Settings,
              'مشترك': MessageCircle
            }

            const CategoryIcon = categoryIcons[category] || Settings

            return (
              <div key={category} className="space-y-1.5">
                {/* Category Header with Icon */}
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <CategoryIcon size={14} />
                  <span>{category}</span>
                  <span className="ml-auto text-[10px] text-gray-400 font-normal">
                    {items.length}
                  </span>
                </div>
                
                {/* Category Items */}
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })
>>>>>>> cursor/fix-code-errors-and-warnings-8041
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
