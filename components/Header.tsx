'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { NAV_LINKS } from '@/shared/constants'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 space-x-reverse hover:opacity-80 transition">
              <Image
                src="/logo.png"
                alt="مركز الهمم"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <span className="text-xl font-bold text-gray-900 font-arabic tracking-tight">مركز الهمم</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-primary transition-smooth font-medium font-arabic"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-primary/10 hover:text-primary transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-100">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded transition"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
