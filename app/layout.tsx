import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alhemam.a'),
  title: 'مركز الهمم - رعاية طبية متخصصة في جدة',
  description: 'مركز الهمم في جدة - رعاية طبية متخصصة في علاج النطق، تعديل السلوك، العلاج الوظيفي، والتكامل الحسي. فريق من الأخصائيين المؤهلين لخدمتك. حجز موعد الآن.',
  keywords: 'مركز الهمم, جدة, علاج النطق, تعديل السلوك, العلاج الوظيفي, التكامل الحسي, التدخل المبكر, تشخيص التوحد, مركز طبي جدة, علاج النطق جدة',
  openGraph: {
    title: 'مركز الهمم - رعاية طبية متخصصة في جدة',
    description: 'رعاية طبية متخصصة في علاج النطق، تعديل السلوك، العلاج الوظيفي، والتكامل الحسي',
    type: 'website',
    locale: 'ar_SA',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="light" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <StructuredData />
        {children}
        <Script src="https://cdn.jsdelivr.net/npm/preline@2.0.0/dist/preline.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}

