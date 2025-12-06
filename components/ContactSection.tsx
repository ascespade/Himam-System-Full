import { centerInfoRepository } from '@/infrastructure/supabase/repositories/center-info.repository'

export default async function ContactSection() {
  const centerInfo = await centerInfoRepository.getCenterInfo()

  if (!centerInfo) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 font-arabic">
            تواصل معنا
          </h2>
          <p className="text-lg text-gray-600 font-arabic">
            نحن هنا لمساعدتك في أي وقت
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-soft text-center">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 font-arabic">الهاتف</h3>
            <div className="space-y-2">
              <a
                href={`tel:${centerInfo.phone}`}
                className="block text-primary hover:text-primary-hover transition-smooth"
              >
                {centerInfo.phone}
              </a>
              {centerInfo.mobile && (
                <a
                  href={`tel:${centerInfo.mobile}`}
                  className="block text-primary hover:text-primary-hover transition-smooth text-sm"
                >
                  {centerInfo.mobile}
                </a>
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-soft text-center">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 font-arabic">البريد الإلكتروني</h3>
            <a
              href={`mailto:${centerInfo.email}`}
              className="text-primary hover:text-primary-hover transition-smooth"
            >
              {centerInfo.email}
            </a>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-soft text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 font-arabic">العنوان</h3>
            <p className="text-gray-600 font-arabic text-sm leading-relaxed">{centerInfo.address_ar}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
