'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CenterInfo {
  name_ar: string
  description_ar: string
  address_ar: string
  email: string
  phone: string
  mobile: string | null
  website: string | null
}

interface Service {
  id: string
  title_ar: string
}

export default function Footer() {
  const [centerInfo, setCenterInfo] = useState<CenterInfo | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from API, but don't fail if it doesn't work
        const [centerRes, servicesRes] = await Promise.allSettled([
          fetch('/api/center/info').catch(() => null),
          fetch('/api/services').catch(() => null),
        ])

        if (centerRes.status === 'fulfilled' && centerRes.value?.ok) {
          const centerData = await centerRes.value.json()
          if (centerData.success) {
            setCenterInfo(centerData.data)
          }
        }

        if (servicesRes.status === 'fulfilled' && servicesRes.value?.ok) {
          const servicesData = await servicesRes.value.json()
          if (servicesData.success) {
            setServices(servicesData.data || [])
          }
        }
      } catch (error) {
        console.error('Error loading footer data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Fallback data if API fails
  const fallbackCenterInfo: CenterInfo = {
    name_ar: 'مركز الهمم',
    description_ar: 'مركز الهمم لرعاية ذوي الاحتياجات الخاصة هو مركز متخصص يقع في جدة، المملكة العربية السعودية، ويقدم خدمات تأهيلية متنوعة للأفراد ذوي الاحتياجات الخاصة. نقدم رعاية شاملة ومتكاملة بفريق من الأخصائيين المؤهلين باستخدام أحدث الأساليب والأدوات.',
    address_ar: 'شارع الأمير محمد بن عبدالعزيز (التحلية)، فندق دبليو إيه، الدور الثامن، حي الصفا، جدة',
    email: 'info@alhemam.sa',
    phone: '0126173693',
    mobile: '0555381558',
    website: 'https://alhemam.sa',
  }

  const displayCenterInfo = centerInfo || fallbackCenterInfo
  const displayServices = services.length > 0 ? services : [
    { id: '1', title_ar: 'جلسات تخاطب' },
    { id: '2', title_ar: 'التواصل الآمن' },
    { id: '3', title_ar: 'المساعد الذكي' },
  ]

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 font-arabic">{displayCenterInfo.name_ar}</h3>
            <p className="text-gray-400 mb-4 font-arabic leading-relaxed">
              {displayCenterInfo.description_ar}
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="text-sm">
                <span className="font-medium text-white">العنوان:</span> {displayCenterInfo.address_ar}
              </p>
              <p>
                <span className="font-medium text-white">البريد الإلكتروني:</span>{' '}
                <a href={`mailto:${displayCenterInfo.email}`} className="hover:text-primary transition">
                  {displayCenterInfo.email}
                </a>
              </p>
              <p>
                <span className="font-medium text-white">الهاتف:</span>{' '}
                <a href={`tel:${displayCenterInfo.phone}`} className="hover:text-primary transition">
                  {displayCenterInfo.phone}
                </a>
              </p>
              {displayCenterInfo.mobile && (
                <p>
                  <span className="font-medium text-white">الجوال:</span>{' '}
                  <a href={`tel:${displayCenterInfo.mobile}`} className="hover:text-primary transition">
                    {displayCenterInfo.mobile}
                  </a>
                </p>
              )}
              {displayCenterInfo.website && (
                <p>
                  <span className="font-medium text-white">الموقع:</span>{' '}
                  <a href={displayCenterInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                    {displayCenterInfo.website.replace('https://', '')}
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
              {displayServices.slice(0, 5).map((service) => (
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
            &copy; {new Date().getFullYear()} {displayCenterInfo.name_ar}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}
