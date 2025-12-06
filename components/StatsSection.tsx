import { statisticsRepository } from '@/infrastructure/supabase/repositories/statistics.repository'

export default async function StatsSection() {
  const stats = await statisticsRepository.getAll()

  if (stats.length === 0) {
    // Fallback to default stats
    const defaultStats = [
      { label_ar: 'سنوات من الخبرة', value: '10+', icon: '📅' },
      { label_ar: 'أخصائي مؤهل', value: '25+', icon: '👨‍⚕️' },
      { label_ar: 'مريض راضٍ', value: '5000+', icon: '😊' },
      { label_ar: 'جلسة علاجية', value: '15000+', icon: '💚' }
    ]
    return (
      <section className="py-16 bg-primary-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {defaultStats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-700 font-arabic">{stat.label_ar}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-primary-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.id} className="text-center">
              {stat.icon && <div className="text-4xl mb-4">{stat.icon}</div>}
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-gray-700 font-arabic">{stat.label_ar}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
