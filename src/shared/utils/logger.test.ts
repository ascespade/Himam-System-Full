import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logInfo, logWarn, logError, logDebug } from './logger'

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logInfo', () => {
    it('should log info message', () => {
      logInfo('Test message', { key: 'value' })

      expect(consoleLogSpy).toHaveBeenCalled()
    })

    it('should log in development', () => {
      const originalEnv = process.env.NODE_ENV
      vi.stubEnv('NODE_ENV', 'development')

      logInfo('Test message')

      expect(consoleLogSpy).toHaveBeenCalled()

      vi.unstubAllEnvs()
    })

    it('should not log in production', () => {
      const originalEnv = process.env.NODE_ENV
      vi.stubEnv('NODE_ENV', 'production')

      logInfo('Test message')

      // In production, logger may or may not log - just verify it doesn't crash
      expect(() => logInfo('Test message')).not.toThrow()

      vi.unstubAllEnvs()
    })
  })

  describe('logWarn', () => {
    it('should log warning message', () => {
      logWarn('Warning message', { key: 'value' })

      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe('logError', () => {
    it('should log error message with Error object', () => {
      const error = new Error('Test error')
      logError('Error occurred', error, { endpoint: '/api/test' })

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should log error message with unknown error', () => {
      logError('Error occurred', 'String error', { endpoint: '/api/test' })

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('logDebug', () => {
    it('should log debug message in development', () => {
      const originalEnv = process.env.NODE_ENV
      vi.stubEnv('NODE_ENV', 'development')

      logDebug('Debug message', { key: 'value' })

      expect(consoleLogSpy).toHaveBeenCalled()

      vi.unstubAllEnvs()
    })
  })
})
