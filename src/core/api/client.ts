/**
 * Centralized API Client
 * Provides consistent HTTP client with error handling, retries, and interceptors
 */

import { successResponse, errorResponse } from '@/shared/utils/api'
import type { ApiResponse } from '@/shared/types'

// ============================================================================
// Types
// ============================================================================

export interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  skipAuth?: boolean
}

export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  defaultRetries?: number
  retryDelay?: number
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseURL: string
  private timeout: number
  private defaultRetries: number
  private defaultRetryDelay: number

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || ''
    this.timeout = config.timeout || 30000
    this.defaultRetries = config.defaultRetries || 3
    this.defaultRetryDelay = config.retryDelay || 1000
  }

  /**
   * Creates a fetch request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  /**
   * Retries a request on failure
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number = this.defaultRetries,
    delay: number = this.defaultRetryDelay
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.retryRequest(fn, retries - 1, delay * 2) // Exponential backoff
      }
      throw error
    }
  }

  /**
   * Handles API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data.data as T
  }

  /**
   * GET request
   */
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`
    
    return this.retryRequest(
      async () => {
        const response = await this.fetchWithTimeout(fullUrl, {
          ...options,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })
        return this.handleResponse<T>(response)
      },
      options.retries,
      options.retryDelay
    )
  }

  /**
   * POST request
   */
  async post<T>(url: string, data: unknown, options: RequestOptions = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`
    
    return this.retryRequest(
      async () => {
        const response = await this.fetchWithTimeout(fullUrl, {
          ...options,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify(data),
        })
        return this.handleResponse<T>(response)
      },
      options.retries,
      options.retryDelay
    )
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data: unknown, options: RequestOptions = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`
    
    return this.retryRequest(
      async () => {
        const response = await this.fetchWithTimeout(fullUrl, {
          ...options,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify(data),
        })
        return this.handleResponse<T>(response)
      },
      options.retries,
      options.retryDelay
    )
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data: unknown, options: RequestOptions = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`
    
    return this.retryRequest(
      async () => {
        const response = await this.fetchWithTimeout(fullUrl, {
          ...options,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify(data),
        })
        return this.handleResponse<T>(response)
      },
      options.retries,
      options.retryDelay
    )
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`
    
    return this.retryRequest(
      async () => {
        const response = await this.fetchWithTimeout(fullUrl, {
          ...options,
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })
        return this.handleResponse<T>(response)
      },
      options.retries,
      options.retryDelay
    )
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const apiClient = new ApiClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  timeout: 30000,
  defaultRetries: 3,
  retryDelay: 1000,
})
