import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppointmentService, appointmentService } from './appointment.service'
import * as appointmentRepositoryModule from '@/infrastructure/supabase/repositories/appointment.repository'

// Mock appointment repository
vi.mock('@/infrastructure/supabase/repositories/appointment.repository', () => ({
  appointmentRepository: {
    findById: vi.fn(),
    findByPatientId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getPaginated: vi.fn(),
  },
}))

vi.mock('@/shared/utils/logger', () => ({
  logInfo: vi.fn(),
}))

describe('AppointmentService', () => {
  let service: AppointmentService
  const mockRepository = appointmentRepositoryModule.appointmentRepository

  beforeEach(() => {
    service = appointmentService
    vi.clearAllMocks()
  })

  describe('getAppointmentById', () => {
    it('should return appointment when found', async () => {
      const appointment = { id: '123', patient_id: 'p1', specialist: 'Dr. Smith', date: '2024-01-01' }
      ;(mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(appointment)

      const result = await service.getAppointmentById('123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(appointment)
      expect(mockRepository.findById).toHaveBeenCalledWith('123')
    })

    it('should return NOT_FOUND when appointment is null', async () => {
      ;(mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const result = await service.getAppointmentById('123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Appointment not found')
      expect(result.code).toBe('NOT_FOUND')
    })

    it('should return error result when repository throws', async () => {
      const error = new Error('Database error')
      ;(mockRepository.findById as ReturnType<typeof vi.fn>).mockRejectedValue(error)

      const result = await service.getAppointmentById('123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(result.code).toBe('SERVICE_ERROR')
    })
  })

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const input = {
        specialist: 'Dr. Smith',
        date: '2024-01-01',
        patient_id: 'p1',
        status: 'pending',
      }
      const createdAppointment = { id: '123', ...input }
      ;(mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdAppointment)

      const result = await service.createAppointment(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(createdAppointment)
      expect(mockRepository.create).toHaveBeenCalled()
    })

    it('should handle repository errors', async () => {
      const input = {
        specialist: 'Dr. Smith',
        date: '2024-01-01',
      }
      const error = new Error('Database error')
      ;(mockRepository.create as ReturnType<typeof vi.fn>).mockRejectedValue(error)

      const result = await service.createAppointment(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const id = '123'
      const input = { status: 'confirmed' }
      const updatedAppointment = { id, status: 'confirmed' }
      ;(mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedAppointment)

      const result = await service.updateAppointment(id, input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedAppointment)
      expect(mockRepository.update).toHaveBeenCalledWith(id, expect.objectContaining({ status: 'confirmed' }))
    })
  })

  describe('deleteAppointment', () => {
    it('should delete appointment successfully', async () => {
      const id = '123'
      ;(mockRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      const result = await service.deleteAppointment(id)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith(id)
    })
  })

  describe('getAppointments', () => {
    it('should return paginated appointments', async () => {
      const appointments = [
        { id: '1', specialist: 'Dr. Smith' },
        { id: '2', specialist: 'Dr. Jones' },
      ]
      const paginatedResult = {
        data: appointments,
        page: 1,
        limit: 50,
        total: 100,
        totalPages: 2,
      }
      ;(mockRepository.getPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(paginatedResult)

      const result = await service.getAppointments(1, 50)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(appointments)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 100,
        totalPages: 2,
      })
    })

    it('should handle repository errors in pagination', async () => {
      const error = new Error('Database error')
      ;(mockRepository.getPaginated as ReturnType<typeof vi.fn>).mockRejectedValue(error)

      const result = await service.getAppointments(1, 50)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(result.code).toBe('FETCH_ERROR')
    })
  })
})
