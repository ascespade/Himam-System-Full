'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  BrainCircuit
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    { name: 'الرئيسية', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'التقويم', href: '/dashboard/calendar', icon: Calendar },
    { name: 'المحادثات', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'المستخدمين', href: '/dashboard/users', icon: Users },
    { name: 'المحتوى', href: '/dashboard/content', icon: FileText },
    { name: 'الذكاء الاصطناعي', href: '/dashboard/knowledge', icon: BrainCircuit },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
  ]

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
        {menuItems.map((item) => {
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
        })}
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
