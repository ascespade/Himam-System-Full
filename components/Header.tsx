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
        <div className="flex justify-between items-center h-32 relative">
          {/* Logo - Circular with orange border, starts from top and extends below header */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
              <div className="absolute top-0 -mb-20">
                {/* Orange circle border */}
                <div className="absolute inset-0 rounded-full border-4 border-primary -z-10 transform scale-110"></div>
                {/* Logo container - circular, larger than header, starts from top and extends below */}
                <div className={`relative rounded-full overflow-hidden transition-all duration-300 shadow-2xl backdrop-blur-sm bg-white/90 border border-white/20 ${
                  scrolled ? 'w-36 h-36' : 'w-48 h-48'
                }`}>
                  {/* Glassmorphism effect with subtle shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-full"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/20 rounded-full"></div>
                  {/* Subtle shine overlay */}
                  <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-full blur-sm"></div>
                  <Image
                    src="/logo.png"
                    alt="Himam Logo"
                    fill
                    className="object-contain p-3 relative z-10"
                    priority
                  />
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
               {NAV_LINKS.map((link) => (
               <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-bold font-arabic transition-all duration-300 relative group py-2 ${scrolled ? 'text-gray-600' : 'text-gray-800'}`}
               >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
               </Link>
               ))}
            
            <Link href="#appointment" className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-bold text-base shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2">
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
