'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { NAV_LINKS } from '@/shared'
import { Calendar } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/90 backdrop-blur-md shadow-sm py-2' 
        : 'bg-transparent py-4'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className={`relative transition-all duration-300 ${scrolled ? 'w-10 h-10' : 'w-12 h-12'}`}>
                  {/* Fallback to text if img fails, but assuming it exists */}
                  <Image
                    src="/logo.png"
                    alt="Himam Logo"
                    fill
                    className="object-contain"
                    priority
                  />
              </div>
              <div className="flex flex-col">
                 <span className={`font-bold font-arabic tracking-tight transition-colors duration-300 ${scrolled ? 'text-gray-900 text-lg' : 'text-gray-900 text-xl'}`}>
                    مركز الهمم
                 </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
               {NAV_LINKS.map((link) => (
               <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-bold font-arabic transition-all duration-300 relative group ${scrolled ? 'text-gray-600' : 'text-gray-800'}`}
               >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
               </Link>
               ))}
            </div>
            
            <Link href="#appointment" className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2">
               <Calendar size={18} />
               <span>حجز موعد</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="space-y-1.5">
               <span className={`block w-6 h-0.5 bg-current transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
               <span className={`block w-6 h-0.5 bg-current transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}></span>
               <span className={`block w-6 h-0.5 bg-current transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-gray-100 flex flex-col space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-gray-800 font-bold hover:bg-gray-50 rounded-xl transition-colors text-right"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link 
               href="#appointment"
               className="block px-4 py-3 bg-primary/10 text-primary font-bold rounded-xl text-center mt-2 hover:bg-primary hover:text-white transition-colors"
               onClick={() => setIsMenuOpen(false)}
            >
               حجز موعد
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
