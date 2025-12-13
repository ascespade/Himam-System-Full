/**
 * Sentry Integration
 * Error tracking and performance monitoring (optional)
 */

let sentryInitialized = false

/**
 * Initialize Sentry
 */
export function initSentry(): void {
  if (sentryInitialized || typeof window === 'undefined') {
    return
  }

  try {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

    if (!dsn) {
      // Sentry DSN not configured, skipping initialization
      return
    }

    // Dynamic import to avoid errors if Sentry is not installed
    // @ts-expect-error - Optional dependency, may not be installed
    import('@sentry/nextjs').then((SentryModule: { init: (config: Record<string, unknown>) => void }) => {
      SentryModule.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
        beforeSend(event: Record<string, unknown>) {
          // Don't send events in development
          if (process.env.NODE_ENV === 'development') {
            return null
          }
          return event
        }
      })

      sentryInitialized = true
      // Sentry initialized successfully
    }).catch(() => {
      // Sentry package not installed, skipping
    })
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error)
  }
}

/**
 * Capture exception
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    console.error('Error:', error, context)
    return
  }

  try {
    // @ts-expect-error - Optional dependency, may not be installed
    import('@sentry/nextjs').then((SentryModule: { captureException: (error: unknown, options?: Record<string, unknown>) => void }) => {
      SentryModule.captureException(error, {
        extra: context
      })
    }).catch(() => {
      console.error('Error:', error, context)
    })
  } catch (err) {
    console.error('Error:', error, context)
  }
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!sentryInitialized) {
    // Fallback logging when Sentry not initialized
    if (level === 'error') {
      console.error(`[${level}]`, message)
    } else {
      console.warn(`[${level}]`, message)
    }
    return
  }

  try {
    // @ts-expect-error - Optional dependency, may not be installed
    import('@sentry/nextjs').then((SentryModule: { captureMessage: (message: string, options?: Record<string, unknown>) => void }) => {
      SentryModule.captureMessage(message, {
        level: level as 'info' | 'warning' | 'error' | 'fatal' | 'debug'
      })
    }).catch(() => {
      // Fallback logging on Sentry error
      if (level === 'error') {
        console.error(`[${level}]`, message)
      } else {
        console.warn(`[${level}]`, message)
      }
    })
  } catch (err) {
    // Fallback logging on exception
    if (level === 'error') {
      console.error(`[${level}]`, message)
    } else {
      console.warn(`[${level}]`, message)
    }
  }
}

// Initialize if in browser
if (typeof window !== 'undefined') {
  initSentry()
}
