import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin', 'arabic'] })

export const metadata: Metadata = {
  title: 'Al-Himam Smart Medical Platform',
  description: 'Enterprise-grade medical management and communication platform for Al-Himam Medical Center - Jeddah, Saudi Arabia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        {children}
        <Script src="https://cdn.jsdelivr.net/npm/preline@2.0.0/dist/preline.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}

