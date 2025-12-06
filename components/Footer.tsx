import { CENTER_INFO } from '@/shared/constants/center-info'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 font-arabic">{CENTER_INFO.name.ar}</h3>
            <p className="text-gray-400 mb-4 font-arabic leading-relaxed">
              {CENTER_INFO.description.ar}
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                <span className="font-medium text-white">العنوان:</span> {CENTER_INFO.location.address}
              </p>
              <p>
                <span className="font-medium text-white">البريد الإلكتروني:</span>{' '}
                <a href={`mailto:${CENTER_INFO.contact.email}`} className="hover:text-primary transition">
                  {CENTER_INFO.contact.email}
                </a>
              </p>
              <p>
                <span className="font-medium text-white">الهاتف:</span>{' '}
                <a href={`tel:${CENTER_INFO.contact.phone}`} className="hover:text-primary transition">
                  {CENTER_INFO.contact.phone}
                </a>
              </p>
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
              {CENTER_INFO.services.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <span className="hover:text-primary transition-smooth cursor-pointer font-arabic">
                    {service.titleAr}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p className="font-arabic">
            &copy; {new Date().getFullYear()} {CENTER_INFO.name.ar}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}
