import { centerInfoRepository, centerValuesRepository } from '@/infrastructure/supabase/repositories'

export default async function AboutSection() {
  const centerInfo = await centerInfoRepository.getCenterInfo()
  const values = await centerValuesRepository.getAll()

  if (!centerInfo) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 font-arabic">
              من نحن
            </h2>
            <p className="text-lg text-gray-700 mb-6 font-arabic leading-relaxed">
              {centerInfo.description_ar}
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-primary font-arabic">رؤيتنا</h3>
                <p className="text-gray-600 font-arabic">{centerInfo.vision_ar}</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-primary font-arabic">مهمتنا</h3>
                <p className="text-gray-600 font-arabic">{centerInfo.mission_ar}</p>
              </div>
            </div>
            {values.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-primary font-arabic">قيمنا</h3>
                <div className="grid grid-cols-2 gap-3">
                  {values.map((value) => (
                    <div key={value.id} className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-primary">✓</span>
                      <span className="text-gray-700 font-arabic">{value.title_ar}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative h-96 rounded-xl overflow-hidden shadow-lg bg-primary-light flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🏥</div>
              <p className="text-primary text-xl font-arabic font-semibold">{centerInfo.name_ar}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
