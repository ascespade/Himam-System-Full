import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService } from './user.service'
import { supabaseAdmin } from '@/lib/supabase'
import { logInfo, logError } from '@/shared/utils/logger'

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/shared/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}))

describe('UserService', () => {
  let userService: UserService
  let mockQuery: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    userService = new UserService()
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery)
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'doctor',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockQuery.single.mockResolvedValue({
        data: mockUser,
        error: null,
      })

      const result = await userService.findById('user_123')

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: new Date(mockUser.created_at),
      })
      expect(supabaseAdmin.from).toHaveBeenCalledWith('users')
      expect(mockQuery.select).toHaveBeenCalledWith('id, email, name, role, phone, created_at, updated_at')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user_123')
      expect(mockQuery.single).toHaveBeenCalled()
    })

    it('should return null when user not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const result = await userService.findById('user_999')

      expect(result).toBeNull()
    })

    it('should throw error on database error', async () => {
      const dbError = new Error('Database connection failed')
      mockQuery.single.mockResolvedValue({
        data: null,
        error: dbError,
      })

      await expect(userService.findById('user_123')).rejects.toThrow('Database connection failed')
      expect(logError).toHaveBeenCalled()
    })
  })

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'doctor',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockQuery.single.mockResolvedValue({
        data: mockUser,
        error: null,
      })

      const result = await userService.findByEmail('test@example.com')

      expect(result).toBeTruthy()
      expect(result?.email).toBe('test@example.com')
      expect(mockQuery.eq).toHaveBeenCalledWith('email', 'test@example.com')
    })
  })

  describe('create', () => {
    it('should create user successfully', async () => {
      const newUser = {
        email: 'new@example.com',
        name: 'New User',
        role: 'patient' as const,
        phone: '+966501234567',
      }

      const createdUser = {
        id: 'user_new',
        ...newUser,
        created_at: '2024-01-01T00:00:00Z',
      }

      mockQuery.single.mockResolvedValue({
        data: createdUser,
        error: null,
      })

      const result = await userService.create(newUser)

      expect(result).toBeTruthy()
      expect(result.email).toBe(newUser.email)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('users')
      expect(mockQuery.insert).toHaveBeenCalled()
      expect(logInfo).toHaveBeenCalled()
    })

    it('should throw error if email already exists', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Duplicate key' },
      })

      await expect(
        userService.create({
          email: 'existing@example.com',
          name: 'User',
          role: 'patient',
        })
      ).rejects.toThrow()
    })
  })

  describe('update', () => {
    it('should update user successfully', async () => {
      const updatedUser = {
        id: 'user_123',
        name: 'Updated Name',
        phone: '+966501234567',
      }

      mockQuery.single.mockResolvedValue({
        data: { ...updatedUser, email: 'test@example.com', role: 'doctor', updated_at: '2024-01-02T00:00:00Z' },
        error: null,
      })

      const result = await userService.update('user_123', { name: 'Updated Name' })

      expect(result).toBeTruthy()
      expect(mockQuery.update).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user_123')
    })
  })

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockQuery.delete.mockResolvedValue({
        data: null,
        error: null,
      })

      await userService.delete('user_123')

      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user_123')
      expect(logInfo).toHaveBeenCalled()
    })
  })
})
