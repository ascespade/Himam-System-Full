import { centerInfoRepository } from '@/src/infrastructure/supabase/repositories/center-info.repository'
import { servicesRepository } from '@/src/infrastructure/supabase/repositories/services.repository'
import Link from 'next/link'

export default async function Footer() {
  const centerInfo = await centerInfoRepository.getCenterInfo()
  const services = await servicesRepository.getAll()

  if (!centerInfo) {
    return null
  }

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 font-arabic">{centerInfo.name_ar}</h3>
            <p className="text-gray-400 mb-4 font-arabic leading-relaxed">
              {centerInfo.description_ar}
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="text-sm">
                <span className="font-medium text-white">العنوان:</span> {centerInfo.address_ar}
              </p>
              <p>
                <span className="font-medium text-white">البريد الإلكتروني:</span>{' '}
                <a href={`mailto:${centerInfo.email}`} className="hover:text-primary transition">
                  {centerInfo.email}
                </a>
              </p>
              <p>
                <span className="font-medium text-white">الهاتف:</span>{' '}
                <a href={`tel:${centerInfo.phone}`} className="hover:text-primary transition">
                  {centerInfo.phone}
                </a>
              </p>
              {centerInfo.mobile && (
                <p>
                  <span className="font-medium text-white">الجوال:</span>{' '}
                  <a href={`tel:${centerInfo.mobile}`} className="hover:text-primary transition">
                    {centerInfo.mobile}
                  </a>
                </p>
              )}
              {centerInfo.website && (
                <p>
                  <span className="font-medium text-white">الموقع:</span>{' '}
                  <a href={centerInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                    {centerInfo.website.replace('https://', '')}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-arabic">روابط سريعة</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/" className="hover:text-primary transition-smooth font-arabic">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/patients" className="hover:text-primary transition-smooth font-arabic">
                  المرضى
                </Link>
              </li>
              <li>
                <Link href="/dashboard/admin" className="hover:text-primary transition-smooth font-arabic">
                  لوحة التحكم
                </Link>
              </li>
              <li>
                <Link href="/sign" className="hover:text-primary transition-smooth font-arabic">
                  التوقيع الإلكتروني
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-arabic">خدماتنا</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              {services.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <span className="hover:text-primary transition-smooth cursor-pointer font-arabic">
                    {service.title_ar}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p className="font-arabic">
            &copy; {new Date().getFullYear()} {centerInfo.name_ar}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}
