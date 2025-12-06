'use client'

import Image from 'next/image'
import { useState } from 'react'
import BookingForm from './BookingForm'
import Button from '@/shared/components/ui/Button'

export default function Hero() {
  const [showBookingForm, setShowBookingForm] = useState(false)

  return (
    <section className="relative text-white py-20 overflow-hidden min-h-[600px] flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/banner.jpg"
          alt="مركز الهمم"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-primary-dark/90" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-scale-in font-arabic tracking-tight leading-tight">
            مركز الهمم
          </h1>
          <p className="text-xl md:text-3xl mb-4 text-white font-semibold font-arabic">
            رعاية طبية متخصصة في جدة
          </p>
          <p className="text-lg md:text-xl mb-8 text-white/95 font-arabic leading-relaxed">
            علاج النطق • تعديل السلوك • العلاج الوظيفي • التكامل الحسي • التدخل المبكر
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setShowBookingForm(!showBookingForm)}
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              حجز موعد الآن
            </Button>
            <Button
              href="/patients"
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              لوحة المريض
            </Button>
          </div>
        </div>

        {showBookingForm && (
          <div className="mt-12 max-w-2xl mx-auto">
            <BookingForm onClose={() => setShowBookingForm(false)} />
          </div>
        )}
      </div>
    </section>
  )
}
