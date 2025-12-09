/**
 * Mock Data and API Responses
 * For testing without database connection
 */

export const mockPatients = [
  {
    id: 'test-patient-1',
    name: 'أحمد محمد العتيبي',
    phone: '+966501234567',
    email: 'ahmed.test@example.com',
    date_of_birth: '2010-05-15',
    gender: 'male',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'test-patient-2',
    name: 'سارة علي',
    phone: '+966502345678',
    email: 'sara.test@example.com',
    date_of_birth: '2012-08-20',
    gender: 'female',
    status: 'active',
    created_at: new Date().toISOString(),
  },
]

export const mockAppointments = [
  {
    id: 'test-appointment-1',
    patient_id: 'test-patient-1',
    doctor_id: 'test-doctor-1',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:00',
    appointment_type: 'consultation',
    status: 'scheduled',
    created_at: new Date().toISOString(),
  },
]

export const mockDoctors = [
  {
    id: 'test-doctor-1',
    name: 'د. سارة الزهراني',
    specialty: 'Speech Therapy',
    email: 'doctor@himam.com',
  },
]

/**
 * Mock API responses for testing
 */
export const mockApiResponses = {
  patients: {
    list: {
      success: true,
      data: mockPatients,
    },
    create: {
      success: true,
      data: mockPatients[0],
    },
  },
  appointments: {
    list: {
      success: true,
      data: mockAppointments,
    },
    create: {
      success: true,
      data: mockAppointments[0],
    },
  },
}
