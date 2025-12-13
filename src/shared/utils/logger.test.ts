import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logInfo, logWarn, logError, logDebug } from './logger'

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logInfo', () => {
    it('should log info message in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logInfo('Test message', { key: 'value' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should not log in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      logInfo('Test message')

      expect(consoleLogSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('logWarn', () => {
    it('should log warning message', () => {
      logWarn('Warning message', { key: 'value' })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message')
      )
    })
  })

  describe('logError', () => {
    it('should log error message with Error object', () => {
      const error = new Error('Test error')
      logError('Error occurred', error, { endpoint: '/api/test' })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred')
      )
    })

    it('should log error message with unknown error', () => {
      logError('Error occurred', 'String error', { endpoint: '/api/test' })

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('logDebug', () => {
    it('should log debug message in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logDebug('Debug message', { key: 'value' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]')
      )

      process.env.NODE_ENV = originalEnv
    })
  })
})
