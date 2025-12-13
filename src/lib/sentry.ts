/**
 * Sentry Integration
 * Error tracking and performance monitoring (optional)
 * Hardened with PII redaction and proper configuration
 */

import { logWarn, logError } from '@/shared/utils/logger'

let sentryInitialized = false

/**
 * Initialize Sentry with hardened configuration
 */
export function initSentry(): void {
  if (sentryInitialized) {
    return
  }

  // Only initialize in production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_SENTRY_IN_DEV) {
    return
  }

  try {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

    if (!dsn) {
      // Sentry DSN not configured, skipping initialization
      return
    }

    // Dynamic import to avoid errors if Sentry is not installed
    // @ts-expect-error - Optional dependency, may not be installed
    import('@sentry/nextjs').then((SentryModule: {
      init: (config: Record<string, unknown>) => void
      captureException: (error: unknown, options?: Record<string, unknown>) => void
    }) => {
      SentryModule.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production
        beforeSend(event: Record<string, unknown>) {
          // Don't send events in development unless explicitly enabled
          if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_SENTRY_IN_DEV) {
            return null
          }

          // Redact PII (Personally Identifiable Information)
          if (event.request && typeof event.request === 'object') {
            const request = event.request as Record<string, unknown>
            // Remove cookies
            if (request.headers && typeof request.headers === 'object') {
              const headers = request.headers as Record<string, unknown>
              delete headers.cookie
              delete headers.authorization
              delete headers['x-api-key']
            }

            // Remove sensitive query params
            if (request.query_string && typeof request.query_string === 'string') {
              const params = new URLSearchParams(request.query_string)
              const sensitiveParams = ['token', 'password', 'api_key', 'secret']
              sensitiveParams.forEach((param) => params.delete(param))
              request.query_string = params.toString()
            }
          }

          // Remove sensitive user data
          if (event.user && typeof event.user === 'object') {
            const user = event.user as Record<string, unknown>
            delete user.email
            delete user.ip_address
          }

          return event
        },
        ignoreErrors: [
          // Browser extensions
          'top.GLOBALS',
          'originalCreateNotification',
          'canvas.contentDocument',
          'MyApp_RemoveAllHighlights',
          'atomicFindClose',
          // Network errors
          'NetworkError',
          'Failed to fetch',
          'Load failed',
        ],
      })

      sentryInitialized = true
    }).catch(() => {
      // Sentry package not installed, skipping
    })
  } catch (error) {
    logWarn('Failed to initialize Sentry', { error })
  }
}

/**
 * Capture exception with PII redaction
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  // Always log locally first
  logError('Exception captured', error, context)

  if (!sentryInitialized) {
    return
  }

  try {
    // @ts-expect-error - Optional dependency, may not be installed
    import('@sentry/nextjs').then((SentryModule: {
      captureException: (error: unknown, options?: Record<string, unknown>) => void
    }) => {
      // Redact sensitive data from context
      const sanitizedContext = context ? redactPII(context) : undefined

      SentryModule.captureException(error, {
        extra: sanitizedContext,
        tags: {
          environment: process.env.NODE_ENV || 'unknown',
        },
      })
    }).catch(() => {
      // Sentry not available, already logged locally
    })
  } catch (err) {
    // Error capturing exception, already logged locally
  }
}

/**
 * Redact PII from context object
 */
function redactPII(context: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'token',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'email',
    'phone',
    'credit_card',
    'ssn',
  ]

  const redacted = { ...context }

  sensitiveKeys.forEach((key) => {
    if (key in redacted) {
      redacted[key] = '[REDACTED]'
    }
  })

  return redacted
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  // Always log locally first
  const { logError, logWarn, logInfo } = require('@/shared/utils/logger')
  
  if (level === 'error') {
    logError(message)
  } else if (level === 'warning') {
    logWarn(message)
  } else {
    logInfo(message)
  }

  if (!sentryInitialized) {
    return
  }

  try {
    // @ts-expect-error - Optional dependency, may not be installed
    import('@sentry/nextjs').then((SentryModule: {
      captureMessage: (message: string, options?: Record<string, unknown>) => void
    }) => {
      SentryModule.captureMessage(message, {
        level: level as 'info' | 'warning' | 'error' | 'fatal' | 'debug',
        tags: {
          environment: process.env.NODE_ENV || 'unknown',
        },
      })
    }).catch(() => {
      // Sentry not available, already logged locally
    })
  } catch (err) {
    // Error capturing message, already logged locally
  }
}

// Initialize if in browser
if (typeof window !== 'undefined') {
  initSentry()
}
