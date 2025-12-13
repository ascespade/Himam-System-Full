/**
 * Centralized Logging Utility
 * Provides consistent logging across the application
 * Integrated with Sentry for error tracking
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  [key: string]: unknown
  requestId?: string
  traceId?: string
  endpoint?: string
  userId?: string
}

/**
 * Generate or retrieve request ID for correlation
 */
function getRequestId(): string {
  // In server-side, try to get from AsyncLocalStorage or generate new
  if (typeof window === 'undefined') {
    // Server-side: generate unique ID per request
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  // Client-side: use session-based ID
  if (typeof sessionStorage !== 'undefined') {
    let requestId = sessionStorage.getItem('requestId')
    if (!requestId) {
      requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('requestId', requestId)
    }
    return requestId
  }
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Logger class for consistent logging with request correlation
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const requestId = context?.requestId || context?.traceId || getRequestId()
    const enrichedContext = {
      ...context,
      requestId,
      traceId: requestId, // Alias for compatibility
    }
    const contextStr = enrichedContext ? ` ${JSON.stringify(enrichedContext)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] [${requestId}] ${message}${contextStr}`
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      // Allowed console usage in logger
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    // Allowed console usage in logger
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const requestId = context?.requestId || context?.traceId || getRequestId()
    const errorContext: LogContext = {
      ...context,
      requestId,
      traceId: requestId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    }
    // Allowed console usage in logger
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('error', message, errorContext))

    // Send to Sentry if error is an Error instance
    if (error instanceof Error) {
      this.sendToSentry(error, errorContext)
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      // Allowed console usage in logger
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  /**
   * Send error to Sentry
   */
  private sendToSentry(error: Error, context?: LogContext): void {
    // Dynamic import to avoid circular dependencies
    if (typeof window === 'undefined') {
      // Server-side: import and use Sentry
      import('@/lib/sentry')
        .then(({ captureException }) => {
          captureException(error, context)
        })
        .catch(() => {
          // Sentry not available, ignore
        })
    } else {
      // Client-side: Sentry is initialized automatically
      import('@/lib/sentry')
        .then(({ captureException }) => {
          captureException(error, context)
        })
        .catch(() => {
          // Sentry not available, ignore
        })
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context)
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context)
export const logError = (message: string, error?: Error | unknown, context?: LogContext) =>
  logger.error(message, error, context)
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context)

