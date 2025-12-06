'use client'

import Image from 'next/image'
import { useState } from 'react'
import BookingForm from './BookingForm'
import Button from '@/shared/components/ui/Button'

export default function Hero() {
  const [showBookingForm, setShowBookingForm] = useState(false)

  return (
    <section className="relative overflow-hidden min-h-[500px] flex items-center">
      {/* Background Image - No overlay to show banner content */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/banner.jpg"
          alt="مركز الهمم"
          fill
          className="object-cover"
          priority
          quality={90}
        />
      </div>
      
      {/* Content Section - Only buttons, no text overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-auto mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => setShowBookingForm(!showBookingForm)}
            variant="primary"
            size="lg"
            className="bg-white text-primary hover:bg-white/95 shadow-lg"
          >
            حجز موعد الآن
          </Button>
          <Button
            href="/patients"
            variant="outline"
            size="lg"
            className="border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white/20"
          >
            لوحة المريض
          </Button>
        </div>

        {showBookingForm && (
          <div className="mt-8 max-w-2xl mx-auto">
            <BookingForm onClose={() => setShowBookingForm(false)} />
          </div>
        )}
      </div>
    </section>
  )
}
