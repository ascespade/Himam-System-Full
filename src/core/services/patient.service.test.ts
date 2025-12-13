import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PatientService, patientService } from './patient.service'
import { ServiceException } from './base.service'
import * as supabaseModule from '@/lib'

// Mock dependencies
vi.mock('@/lib', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/shared/utils/logger', () => ({
  logError: vi.fn(),
}))

describe('PatientService', () => {
  let service: PatientService
  let mockQuery: {
    select: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    neq: ReturnType<typeof vi.fn>
    single: ReturnType<typeof vi.fn>
    insert: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = patientService
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    }
    ;(supabaseModule.supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery)
  })

  describe('createPatient', () => {
    it('should create patient successfully', async () => {
      const input = {
        name: 'Test Patient',
        phone: '+966501234567',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        gender: 'male' as const,
      }

      // Mock: no existing patient
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      // Mock: successful insert
      mockQuery.single.mockResolvedValueOnce({
        data: { id: '123', ...input, created_at: new Date().toISOString() },
        error: null,
      })

      const result = await service.createPatient(input)

      expect(result.id).toBe('123')
      expect(result.name).toBe('Test Patient')
      expect(mockQuery.insert).toHaveBeenCalled()
    })

    it('should throw ServiceException if patient with phone exists', async () => {
      const input = {
        name: 'Test Patient',
        phone: '+966501234567',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        gender: 'male' as const,
      }

      // Mock: existing patient found
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'existing-id' },
        error: null,
      })

      await expect(service.createPatient(input)).rejects.toThrow(ServiceException)
      await expect(service.createPatient(input)).rejects.toThrow('Patient with this phone number already exists')
    })

    it('should throw ServiceException on database error', async () => {
      const input = {
        name: 'Test Patient',
        phone: '+966501234567',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        gender: 'male' as const,
      }

      // Mock: no existing patient
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      // Mock: insert error
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(service.createPatient(input)).rejects.toThrow(ServiceException)
      await expect(service.createPatient(input)).rejects.toThrow('Failed to create patient')
    })
  })

  describe('updatePatient', () => {
    it('should update patient successfully', async () => {
      const patientId = '123'
      const input = { name: 'Updated Name' }

      // Mock: no phone conflict
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      // Mock: successful update
      mockQuery.single.mockResolvedValueOnce({
        data: { id: patientId, name: 'Updated Name' },
        error: null,
      })

      const result = await service.updatePatient(patientId, input)

      expect(result.id).toBe(patientId)
      expect(result.name).toBe('Updated Name')
      expect(mockQuery.update).toHaveBeenCalled()
    })

    it('should throw ServiceException if patient not found', async () => {
      const patientId = '123'
      const input = { name: 'Updated Name' }

      // Mock: no phone conflict
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      // Mock: patient not found
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      await expect(service.updatePatient(patientId, input)).rejects.toThrow(ServiceException)
      await expect(service.updatePatient(patientId, input)).rejects.toThrow('Patient not found')
    })
  })

  describe('findById', () => {
    it('should return patient when found', async () => {
      const patientId = '123'
      const patientData = { id: patientId, name: 'Test Patient', phone: '+966501234567' }

      mockQuery.single.mockResolvedValueOnce({
        data: patientData,
        error: null,
      })

      const result = await service.findById(patientId)

      expect(result).toEqual(patientData)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', patientId)
    })

    it('should return null when patient not found', async () => {
      const patientId = '123'

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.findById(patientId)

      expect(result).toBeNull()
    })
  })

  describe('findByPhone', () => {
    it('should return patient when found by phone', async () => {
      const phone = '+966501234567'
      const patientData = { id: '123', name: 'Test Patient', phone }

      mockQuery.single.mockResolvedValueOnce({
        data: patientData,
        error: null,
      })

      const result = await service.findByPhone(phone)

      expect(result).toEqual(patientData)
      expect(mockQuery.eq).toHaveBeenCalledWith('phone', phone)
    })
  })

  describe('search', () => {
    it('should return paginated search results', async () => {
      const query = 'test'
      const page = 1
      const limit = 50
      const patients = [
        { id: '1', name: 'Test Patient 1' },
        { id: '2', name: 'Test Patient 2' },
      ]

      // Mock count query
      const mockCountQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({
          data: patients,
          error: null,
          count: 100,
        }),
      }
      ;(supabaseModule.supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue(mockCountQuery)

      const result = await service.search(query, page, limit)

      expect(result.data).toEqual(patients)
      expect(result.total).toBe(100)
      expect(mockCountQuery.or).toHaveBeenCalled()
    })
  })
})
