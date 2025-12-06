import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import SpecialistCard from '@/components/SpecialistCard'
import ChatWidget from '@/components/ChatWidget'
import AboutSection from '@/components/AboutSection'
import StatsSection from '@/components/StatsSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import ContactSection from '@/components/ContactSection'
import MapSection from '@/components/MapSection'
import { supabaseAdmin } from '@/lib'
import { servicesRepository, centerInfoRepository } from '@/infrastructure/supabase/repositories'
import { Specialist } from '@/shared'

async function getSpecialists(): Promise<Specialist[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('specialists')
      .select('*')
      .limit(6)

    if (error) {
      console.error('Error fetching specialists:', error)
      return []
    }
    return (data || []) as Specialist[]
  } catch (error) {
    console.error('Error fetching specialists:', error)
    return []
  }
}

const ServiceIcon = ({ icon }: { icon: string | null }) => {
  const icons: Record<string, JSX.Element> = {
    calendar: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    message: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    sparkles: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  }
  return icons[icon || 'sparkles'] || icons.sparkles
}

export default async function HomePage() {
  const specialists = await getSpecialists()
  const services = await servicesRepository.getAll()
  const centerInfo = await centerInfoRepository.getCenterInfo()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <Hero />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* About Section */}
      <AboutSection />
      
      {/* Specialists Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 font-arabic tracking-tight">
              أخصائينا المتميزون
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-arabic leading-relaxed">
              فريق من الأخصائيين المؤهلين والمدربين في {centerInfo?.city_ar || 'جدة'} لتقديم أفضل الخدمات الطبية
            </p>
          </div>
          {specialists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialists.map((specialist) => (
                <SpecialistCard key={specialist.id} specialist={specialist} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-primary font-bold text-xl">👨‍⚕️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-center text-gray-900 font-arabic mb-2">
                    أخصائي متخصص
                  </h3>
                  <p className="text-primary text-center text-sm mb-4 font-arabic">متوفر قريباً</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 font-arabic tracking-tight">
              خدماتنا المتكاملة
            </h2>
            {centerInfo && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6 font-arabic leading-relaxed">
                {centerInfo.description_ar}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-8 bg-white rounded-xl border border-gray-200 hover:border-primary/40 hover:shadow-medium transition-smooth group"
              >
                <div className="w-16 h-16 bg-primary-light rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <div className="text-primary group-hover:text-white transition-colors">
                    <ServiceIcon icon={service.icon} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center text-gray-900 font-arabic">
                  {service.title_ar}
                </h3>
                <p className="text-gray-600 text-center font-arabic leading-relaxed">
                  {service.description_ar}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Map Section */}
      <MapSection />

      <Footer />
      <ChatWidget />
    </div>
  )
}
