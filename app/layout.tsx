import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'مركز الهمم - منصة مركز الهممة الذكية',
  description: 'مركز الهمم في جدة - رعاية طبية متخصصة في علاج النطق، تعديل السلوك، العلاج الوظيفي، والتكامل الحسي. فريق من الأخصائيين المؤهلين لخدمتك.',
  keywords: 'مركز الهمم, جدة, علاج النطق, تعديل السلوك, العلاج الوظيفي, التكامل الحسي, التدخل المبكر, تشخيص التوحد',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="light">
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
        <Script src="https://cdn.jsdelivr.net/npm/preline@2.0.0/dist/preline.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}

