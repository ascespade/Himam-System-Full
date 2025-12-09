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
      console.log('Sentry DSN not configured, skipping initialization')
      return
    }

    // Dynamic import to avoid errors if Sentry is not installed
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
        beforeSend(event) {
          // Don't send events in development
          if (process.env.NODE_ENV === 'development') {
            return null
          }
          return event
        }
      })

      sentryInitialized = true
      console.log('✅ Sentry initialized')
    }).catch(() => {
      console.log('Sentry package not installed, skipping')
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
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error, {
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
    console.log(`[${level}]`, message)
    return
  }

  try {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureMessage(message, {
        level: level as any
      })
    }).catch(() => {
      console.log(`[${level}]`, message)
    })
  } catch (err) {
    console.log(`[${level}]`, message)
  }
}

// Initialize if in browser
if (typeof window !== 'undefined') {
  initSentry()
}
