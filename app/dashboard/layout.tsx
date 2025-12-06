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
          {children}
       </div>
    </div>
  )
}
