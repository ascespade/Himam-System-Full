/**
 * Test Data Fixtures
 * Reusable test data for consistent testing
 */

export const testData = {
  patients: {
    valid: {
      name: 'أحمد محمد العتيبي',
      phone: '+966501234567',
      email: 'ahmed.test@example.com',
      date_of_birth: '2010-05-15',
      gender: 'male' as const,
      national_id: '1234567890',
      nationality: 'Saudi',
    },
    minimal: {
      name: 'سارة علي',
      phone: '+966502345678',
    },
    invalid: {
      name: '',
      phone: '123', // Invalid format
      email: 'invalid-email',
    },
  },
  
  appointments: {
    valid: {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      time: '10:00',
      appointment_type: 'consultation',
    },
    past: {
      date: '2020-01-01',
      time: '10:00',
    },
  },
  
  users: {
    admin: {
      email: 'admin@himam.com',
      password: 'admin123',
      name: 'مدير النظام',
    },
    doctor: {
      email: 'doctor@himam.com',
      password: 'doctor123',
      name: 'د. سارة الزهراني',
    },
    reception: {
      email: 'reception@himam.com',
      password: 'reception123',
      name: 'موظف الاستقبال',
    },
  },
}
