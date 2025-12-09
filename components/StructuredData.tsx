import { centerInfoRepository, servicesRepository } from '@/infrastructure/supabase/repositories'

export default async function StructuredData() {
  try {
  const centerInfo = await centerInfoRepository.getCenterInfo()
  const services = await servicesRepository.getAll()

  if (!centerInfo) {
      console.warn('StructuredData: centerInfo is null')
    return null
  }

    if (!services || services.length === 0) {
      console.warn('StructuredData: services is empty or null')
    }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: centerInfo.name_ar,
    alternateName: centerInfo.name_en,
    description: centerInfo.description_ar,
    address: {
      '@type': 'PostalAddress',
      streetAddress: centerInfo.address_ar,
      addressLocality: centerInfo.city_ar,
      addressCountry: centerInfo.country_en,
      addressRegion: centerInfo.city_en
    },
    telephone: centerInfo.mobile ? [centerInfo.phone, centerInfo.mobile] : centerInfo.phone,
    email: centerInfo.email,
    url: centerInfo.website || process.env.NEXT_PUBLIC_SITE_URL || 'https://alhemam.sa',
    priceRange: '$$',
      medicalSpecialty: services?.map(s => s.title_ar) || [],
    areaServed: {
      '@type': 'City',
      name: centerInfo.city_ar
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
  } catch (error) {
    console.error('Error generating structured data:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return null
  }
}
