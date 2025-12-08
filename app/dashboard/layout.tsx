import NotificationsMenu from '@/components/NotificationsMenu'
import Sidebar from '@/components/Sidebar'
import UserHeader from '@/components/UserHeader'
import { Toaster } from 'sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]" dir="rtl">
       <Sidebar />
       <div className="md:mr-64 min-h-screen transition-all duration-300">
          <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-end px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <NotificationsMenu />
              <UserHeader />
            </div>
          </header>
          {children}
       </div>
       <Toaster position="top-center" richColors />
    </div>
  )
}
