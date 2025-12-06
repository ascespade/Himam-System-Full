import { Specialist } from '@/src/shared/types'
import Button from '@/src/shared/components/ui/Button'

interface SpecialistCardProps {
  specialist: Specialist
}

export default function SpecialistCard({ specialist }: SpecialistCardProps) {
  const initials = specialist.name.split(' ').map(n => n[0]).join('').toUpperCase()
  const imagePlaceholder = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23fff7ed" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23f97316" text-anchor="middle" dominant-baseline="middle" font-family="Arial"%3E${encodeURIComponent(initials)}%3C/text%3E%3C/svg%3E`

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/20 group">
      <div className="flex items-center space-x-4 space-x-reverse mb-4">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors overflow-hidden">
          <img
            src={imagePlaceholder}
            alt={specialist.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{specialist.name}</h3>
          <p className="text-primary font-medium text-sm">{specialist.specialty}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {specialist.nationality && (
          <p>
            <span className="font-medium text-gray-700">الجنسية:</span> {specialist.nationality}
          </p>
        )}
        {specialist.email && (
          <p>
            <span className="font-medium text-gray-700">البريد:</span> {specialist.email}
          </p>
        )}
      </div>
      <Button variant="primary" size="md" className="w-full">
        حجز موعد
      </Button>
    </div>
  )
}
