/**
 * Centralized Logging Utility
 * Provides consistent logging across the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  [key: string]: unknown
}

/**
 * Logger class for consistent logging
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorContext = {
      ...context,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    }
    console.error(this.formatMessage('error', message, errorContext))
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
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

