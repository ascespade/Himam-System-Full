interface Specialist {
  id: string
  name: string
  specialty: string
  nationality: string
  email: string
}

interface SpecialistCardProps {
  specialist: Specialist
}

export default function SpecialistCard({ specialist }: SpecialistCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center space-x-4 space-x-reverse mb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-bold text-xl">
            {specialist.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{specialist.name}</h3>
          <p className="text-blue-600 font-medium">{specialist.specialty}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <p><span className="font-medium">الجنسية:</span> {specialist.nationality}</p>
        <p><span className="font-medium">البريد:</span> {specialist.email}</p>
      </div>
      <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        حجز موعد
      </button>
    </div>
  )
}

