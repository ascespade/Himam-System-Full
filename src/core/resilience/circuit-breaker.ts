/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by breaking the circuit when failures exceed threshold
 */

export interface CircuitBreakerOptions {
  failureThreshold?: number
  resetTimeout?: number
  monitoringPeriod?: number
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 60000 // 1 minute
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime: number | null = null
  private successCount = 0

  constructor(
    private options: CircuitBreakerOptions = {},
    private name: string = 'default'
  ) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`)
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false

    const opts = { ...DEFAULT_OPTIONS, ...this.options }
    return Date.now() - this.lastFailureTime >= opts.resetTimeout
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      const opts = { ...DEFAULT_OPTIONS, ...this.options }

      // If we have enough successes, close the circuit
      if (this.successCount >= 2) {
        this.state = CircuitState.CLOSED
        this.successCount = 0
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    const opts = { ...DEFAULT_OPTIONS, ...this.options }

    if (this.failureCount >= opts.failureThreshold) {
      this.state = CircuitState.OPEN
      console.warn(`Circuit breaker ${this.name} opened due to ${this.failureCount} failures`)
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
  }
}

// Global circuit breakers
const circuitBreakers = new Map<string, CircuitBreaker>()

/**
 * Get or create circuit breaker
 */
export function getCircuitBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(options, name))
  }
  return circuitBreakers.get(name)!
}
