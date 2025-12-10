/**
 * API Hooks
 * Centralized React hooks for data fetching
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { ApiResponse } from '@/shared/types'

// ============================================================================
// Types
// ============================================================================

export interface UseApiOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  showToast?: boolean
}

export interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (newData: T) => void
}

// ============================================================================
// useApi Hook
// ============================================================================

/**
 * Generic hook for fetching data from API
 */
export function useApi<T>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { immediate = true, onSuccess, onError, showToast = true } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(url)
      const result: ApiResponse<T> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      setData(result.data as T)
      onSuccess?.(result.data as T)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      setData(null)
      
      if (showToast) {
        toast.error(errorMessage)
      }
      
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [url, onSuccess, onError, showToast])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [immediate, fetchData])

  const mutate = useCallback((newData: T) => {
    setData(newData)
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate,
  }
}

// ============================================================================
// useMutation Hook
// ============================================================================

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void
  onError?: (error: string) => void
  showToast?: boolean
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>
  loading: boolean
  error: string | null
  reset: () => void
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
export function useMutation<TData, TVariables = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, showToast = true } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variables),
      })

      const result: ApiResponse<TData> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Operation failed')
      }

      const data = result.data as TData
      
      if (showToast) {
        toast.success('Operation completed successfully')
      }
      
      onSuccess?.(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      
      if (showToast) {
        toast.error(errorMessage)
      }
      
      onError?.(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [url, method, onSuccess, onError, showToast])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return {
    mutate,
    loading,
    error,
    reset,
  }
}
