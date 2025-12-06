'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Mail, Instagram, Twitter, Facebook, Lock } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand & Bio */}
          <div>
             <h2 className="text-2xl font-bold font-arabic mb-6 text-white">مركز الهمم</h2>
             <p className="text-gray-400 mb-6 leading-loose text-sm font-arabic">
                مركز متخصص في تقديم خدمات التأهيل الشامل لذوي الاحتياجات الخاصة في جدة. نلتزم بأعلى معايير الجودة والرعاية المهنية.
             </p>
             <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all text-gray-400">
                   <Twitter size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all text-gray-400">
                   <Instagram size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-gray-400">
                   <Facebook size={20} />
                </a>
             </div>
          </div>

          {/* Quick Links */}
          <div>
             <h3 className="text-lg font-bold font-arabic mb-6 text-white border-b border-gray-800 pb-2 inline-block">روابط هامة</h3>
             <ul className="space-y-4">
                <li><Link href="#about" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">من نحن</Link></li>
                <li><Link href="#services" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">خدماتنا</Link></li>
                <li><Link href="#team" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">الفريق الطبي</Link></li>
                <li><Link href="#community" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">المجتمع</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">سياسة الخصوصية</Link></li>
             </ul>
          </div>

          {/* Services Links */}
          <div>
             <h3 className="text-lg font-bold font-arabic mb-6 text-white border-b border-gray-800 pb-2 inline-block">خدماتنا</h3>
             <ul className="space-y-4">
                <li><Link href="#" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">علاج النطق والتخاطب</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">تعديل السلوك</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">العلاج الوظيفي</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">التدخل المبكر</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-primary transition-colors text-sm font-arabic">تنمية المهارات</Link></li>
             </ul>
          </div>

          {/* Contact Info */}
          <div>
             <h3 className="text-lg font-bold font-arabic mb-6 text-white border-b border-gray-800 pb-2 inline-block">تواصل معنا</h3>
             <ul className="space-y-4">
                <li className="flex items-start gap-3">
                   <MapPin className="text-primary mt-1 shrink-0" size={18} />
                   <span className="text-gray-400 text-sm font-arabic">جدة، حي الصفا، شارع التحلية، فندق WA، الدور الثامن</span>
                </li>
                <li className="flex items-center gap-3">
                   <Phone className="text-primary shrink-0" size={18} />
                   <span className="text-gray-400 text-sm font-arabic">0126173693 / 0555381558</span>
                </li>
                <li className="flex items-center gap-3">
                   <Mail className="text-primary shrink-0" size={18} />
                   <span className="text-gray-400 text-sm font-arabic">info@alhemam.sa</span>
                </li>
             </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-gray-500 text-sm font-arabic text-center md:text-right">
              &copy; {currentYear} مركز الهمم. جميع الحقوق محفوظة.
           </p>
           
           <div className="flex items-center gap-6">
              <Link href="/login" className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-xs font-arabic">
                 <Lock size={12} />
                 الدخول للموظفين
              </Link>
           </div>
        </div>
      </div>
    </footer>
  )
}
