'use client'

import { useState } from 'react'
import BookingForm from './BookingForm'

export default function Hero() {
  const [showBookingForm, setShowBookingForm] = useState(false)

  return (
    <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            منصة الحميم الطبية الذكية
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            إدارة متكاملة للمرضى والمواعيد والتواصل الآمن مع الأخصائيين
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowBookingForm(!showBookingForm)}
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              حجز موعد الآن
            </button>
            <a
              href="/patients"
              className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg"
            >
              لوحة المريض
            </a>
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

