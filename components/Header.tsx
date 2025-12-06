'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ح</span>
              </div>
              <span className="text-xl font-bold text-gray-900">الحميم الطبي</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              الرئيسية
            </Link>
            <Link href="/patients" className="text-gray-700 hover:text-blue-600 transition">
              المرضى
            </Link>
            <Link href="/dashboard/admin" className="text-gray-700 hover:text-blue-600 transition">
              لوحة التحكم
            </Link>
            <Link href="/sign" className="text-gray-700 hover:text-blue-600 transition">
              التوقيع الإلكتروني
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              الرئيسية
            </Link>
            <Link href="/patients" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              المرضى
            </Link>
            <Link href="/dashboard/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              لوحة التحكم
            </Link>
            <Link href="/sign" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              التوقيع الإلكتروني
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

