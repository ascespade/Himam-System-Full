import { describe, it, expect, vi } from 'vitest'
import { BaseService, ServiceException, type ServiceResult } from './base.service'

// Create a concrete implementation for testing
class TestService extends BaseService {
  async testExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    context?: Record<string, unknown>
  ): Promise<ServiceResult<T>> {
    return this.execute(operation, errorMessage, context)
  }

  testValidateInput<T>(
    data: unknown,
    validator: (data: unknown) => data is T
  ): ServiceResult<T> {
    return this.validateInput(data, validator)
  }

  testLogOperation(operation: string, context?: Record<string, unknown>): void {
    this.logOperation(operation, context)
  }
}

describe('BaseService', () => {
  let service: TestService

  beforeEach(() => {
    service = new TestService()
  })

  describe('execute', () => {
    it('should return success result when operation succeeds', async () => {
      const operation = vi.fn().mockResolvedValue({ id: '123', name: 'Test' })

      const result = await service.testExecute(
        operation,
        'Operation failed',
        { test: 'context' }
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: '123', name: 'Test' })
      expect(result.error).toBeUndefined()
      expect(operation).toHaveBeenCalled()
    })

    it('should return error result when operation throws Error', async () => {
      const error = new Error('Test error')
      const operation = vi.fn().mockRejectedValue(error)

      const result = await service.testExecute(
        operation,
        'Operation failed',
        { test: 'context' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Test error')
      expect(result.code).toBe('SERVICE_ERROR')
      expect(result.data).toBeUndefined()
    })

    it('should return error result when operation throws non-Error', async () => {
      const operation = vi.fn().mockRejectedValue('String error')

      const result = await service.testExecute(
        operation,
        'Operation failed',
        { test: 'context' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Operation failed')
      expect(result.code).toBe('SERVICE_ERROR')
    })
  })

  describe('validateInput', () => {
    it('should return success when validation passes', () => {
      const validator = (data: unknown): data is string => typeof data === 'string'
      const result = service.testValidateInput('test', validator)

      expect(result.success).toBe(true)
      expect(result.data).toBe('test')
    })

    it('should return error when validation fails', () => {
      const validator = (data: unknown): data is string => typeof data === 'string'
      const result = service.testValidateInput(123, validator)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid input data')
      expect(result.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('logOperation', () => {
    it('should log operation with context', () => {
      const logInfoSpy = vi.spyOn(require('@/shared/utils/logger'), 'logInfo')
      service.testLogOperation('testOperation', { key: 'value' })

      expect(logInfoSpy).toHaveBeenCalledWith(
        'Service operation: testOperation',
        { key: 'value' }
      )
    })

    it('should log operation without context', () => {
      const logInfoSpy = vi.spyOn(require('@/shared/utils/logger'), 'logInfo')
      service.testLogOperation('testOperation')

      expect(logInfoSpy).toHaveBeenCalledWith(
        'Service operation: testOperation',
        undefined
      )
    })
  })
})

describe('ServiceException', () => {
  it('should create exception with message and code', () => {
    const exception = new ServiceException('Test error', 'TEST_CODE')

    expect(exception.message).toBe('Test error')
    expect(exception.code).toBe('TEST_CODE')
    expect(exception).toBeInstanceOf(Error)
  })

  it('should create exception with default code', () => {
    const exception = new ServiceException('Test error')

    expect(exception.message).toBe('Test error')
    expect(exception.code).toBe('SERVICE_ERROR')
  })
})
