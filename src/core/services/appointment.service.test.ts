import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppointmentService } from './appointment.service'
import { appointmentRepository } from '@/infrastructure/supabase/repositories/appointment.repository'
import { logInfo, logError } from '@/shared/utils/logger'

vi.mock('@/infrastructure/supabase/repositories/appointment.repository', () => ({
  appointmentRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
}))

vi.mock('@/shared/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}))

describe('AppointmentService', () => {
  let appointmentService: AppointmentService

  beforeEach(() => {
    vi.clearAllMocks()
    appointmentService = new AppointmentService()
  })

  describe('getAppointmentById', () => {
    it('should return appointment when found', async () => {
      const mockAppointment = {
        id: 'apt_123',
        patient_id: 'patient_123',
        doctor_id: 'doctor_123',
        date: '2024-01-15',
        status: 'scheduled',
      }

      vi.mocked(appointmentRepository.findById).mockResolvedValue(mockAppointment)

      const result = await appointmentService.getAppointmentById('apt_123')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockAppointment)
      }
      expect(appointmentRepository.findById).toHaveBeenCalledWith('apt_123')
    })

    it('should return NOT_FOUND when appointment not found', async () => {
      vi.mocked(appointmentRepository.findById).mockResolvedValue(null)

      const result = await appointmentService.getAppointmentById('apt_999')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('NOT_FOUND')
      }
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(appointmentRepository.findById).mockRejectedValue(error)

      const result = await appointmentService.getAppointmentById('apt_123')

      expect(result.success).toBe(false)
      expect(logError).toHaveBeenCalled()
    })
  })

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const input = {
        patient_id: 'patient_123',
        specialist: 'doctor_123',
        date: '2024-01-15',
        status: 'scheduled',
      }

      const createdAppointment = {
        id: 'apt_new',
        ...input,
        created_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(appointmentRepository.create).mockResolvedValue(createdAppointment)

      const result = await appointmentService.createAppointment(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(createdAppointment)
      }
      expect(appointmentRepository.create).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const invalidInput = {
        specialist: '',
        date: '',
      }

      const result = await appointmentService.createAppointment(invalidInput as any)

      expect(result.success).toBe(false)
    })
  })

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const updateData = {
        status: 'completed',
        notes: 'Patient attended',
      }

      const updatedAppointment = {
        id: 'apt_123',
        patient_id: 'patient_123',
        doctor_id: 'doctor_123',
        date: '2024-01-15',
        ...updateData,
      }

      vi.mocked(appointmentRepository.update).mockResolvedValue(updatedAppointment)

      const result = await appointmentService.updateAppointment('apt_123', updateData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(updatedAppointment)
      }
      expect(appointmentRepository.update).toHaveBeenCalledWith('apt_123', updateData)
    })
  })

  describe('deleteAppointment', () => {
    it('should delete appointment successfully', async () => {
      vi.mocked(appointmentRepository.delete).mockResolvedValue(undefined)

      const result = await appointmentService.deleteAppointment('apt_123')

      expect(result.success).toBe(true)
      expect(appointmentRepository.delete).toHaveBeenCalledWith('apt_123')
    })
  })

  describe('getAppointments', () => {
    it('should return paginated appointments', async () => {
      const mockAppointments = [
        { id: 'apt_1', patient_id: 'patient_1', date: '2024-01-15' },
        { id: 'apt_2', patient_id: 'patient_2', date: '2024-01-16' },
      ]

      vi.mocked(appointmentRepository.findMany).mockResolvedValue({
        data: mockAppointments,
        total: 2,
      })

      const result = await appointmentService.getAppointments({ page: 1, limit: 10 })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data).toEqual(mockAppointments)
        expect(result.data.total).toBe(2)
      }
    })
  })
})
