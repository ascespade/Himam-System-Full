import { testimonialsRepository } from '@/src/infrastructure/supabase/repositories/testimonials.repository'

export default async function TestimonialsSection() {
  const testimonials = await testimonialsRepository.getFeatured(3)

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 font-arabic">
            آراء عملائنا
          </h2>
          <p className="text-lg text-gray-600 font-arabic">
            نفتخر بثقة عملائنا ورضاهم عن خدماتنا
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-medium transition-smooth"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-primary text-xl">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 font-arabic leading-relaxed">
                "{testimonial.content_ar}"
              </p>
              <div>
                <div className="font-semibold text-gray-900 font-arabic">{testimonial.name}</div>
                {testimonial.role && (
                  <div className="text-sm text-gray-600 font-arabic">{testimonial.role}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
