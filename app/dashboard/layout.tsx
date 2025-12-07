import NotificationsMenu from '@/components/NotificationsMenu'
import Sidebar from '@/components/Sidebar'

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
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  A
                </div>
                <form action="/auth/signout" method="post">
                  <button className="text-sm text-red-500 hover:text-red-700 font-medium">
                    تسجيل خروج
                  </button>
                </form>
              </div>
            </div>
          </header>
          {children}
       </div>
    </div>
  )
}
