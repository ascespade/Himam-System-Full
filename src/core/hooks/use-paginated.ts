/**
 * Paginated Data Hook
 * Hook for fetching paginated data with automatic pagination handling
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { ApiResponse, PaginatedResponse } from '@/shared/types'

// ============================================================================
// Types
// ============================================================================

export interface UsePaginatedOptions<T> {
  initialPage?: number
  initialLimit?: number
  onSuccess?: (data: T[]) => void
  onError?: (error: string) => void
  showToast?: boolean
}

export interface UsePaginatedResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  refetch: () => Promise<void>
  nextPage: () => void
  prevPage: () => void
}

// ============================================================================
// usePaginated Hook
// ============================================================================

/**
 * Hook for fetching paginated data
 */
export function usePaginated<T>(
  url: string,
  options: UsePaginatedOptions<T> = {}
): UsePaginatedResult<T> {
  const {
    initialPage = 1,
    initialLimit = 50,
    onSuccess,
    onError,
    showToast = false,
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const urlWithParams = new URL(url, typeof window !== 'undefined' ? window.location.origin : '')
      urlWithParams.searchParams.set('page', page.toString())
      urlWithParams.searchParams.set('limit', limit.toString())

      const response = await fetch(urlWithParams.toString())
      const result: PaginatedResponse<T> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      setData(result.data || [])
      setTotal(result.pagination?.total || 0)
      onSuccess?.(result.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      setData([])
      
      if (showToast) {
        toast.error(errorMessage)
      }
      
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [url, page, limit, onSuccess, onError, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(prev => prev + 1)
    }
  }, [hasNext])

  const prevPage = useCallback(() => {
    if (hasPrev) {
      setPage(prev => prev - 1)
    }
  }, [hasPrev])

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    setLimit,
    refetch: fetchData,
    nextPage,
    prevPage,
  }
}
