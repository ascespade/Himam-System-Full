/**
 * Core Error Classes
 * Standardized error classes for the application
 */

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'DatabaseError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message)
    this.name = 'ValidationError'
    Error.captureStackTrace(this, this.constructor)
  }
}
