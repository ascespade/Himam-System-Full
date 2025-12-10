/**
 * Infinite Scroll Hook
 * Hook for infinite scroll pagination
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { ApiResponse, PaginatedResponse } from '@/shared/types'

// ============================================================================
// Types
// ============================================================================

export interface UseInfiniteScrollOptions<T> {
  initialPage?: number
  initialLimit?: number
  onSuccess?: (data: T[]) => void
  onError?: (error: string) => void
  showToast?: boolean
  hasMore?: (data: T[], total: number) => boolean
}

export interface UseInfiniteScrollResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
  reset: () => void
  refetch: () => Promise<void>
}

// ============================================================================
// useInfiniteScroll Hook
// ============================================================================

/**
 * Hook for infinite scroll pagination
 */
export function useInfiniteScroll<T>(
  url: string,
  options: UseInfiniteScrollOptions<T> = {}
): UseInfiniteScrollResult<T> {
  const {
    initialPage = 1,
    initialLimit = 20,
    onSuccess,
    onError,
    showToast = false,
    hasMore: hasMoreFn,
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef(false)

  const defaultHasMore = useCallback((items: T[], totalCount: number) => {
    return items.length < totalCount
  }, [])

  const checkHasMore = hasMoreFn || defaultHasMore

  const fetchData = useCallback(async (pageNum: number, append = false) => {
    if (loadingRef.current) return

    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)

      const urlWithParams = new URL(url, typeof window !== 'undefined' ? window.location.origin : '')
      urlWithParams.searchParams.set('page', pageNum.toString())
      urlWithParams.searchParams.set('limit', initialLimit.toString())

      const response = await fetch(urlWithParams.toString())
      const result: PaginatedResponse<T> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      const newData = result.data || []
      const totalCount = result.pagination?.total || 0

      if (append) {
        setData(prev => [...prev, ...newData])
      } else {
        setData(newData)
      }

      setTotal(totalCount)
      setHasMore(checkHasMore(append ? [...data, ...newData] : newData, totalCount))
      setPage(pageNum)

      onSuccess?.(append ? [...data, ...newData] : newData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)

      if (showToast) {
        toast.error(errorMessage)
      }

      onError?.(errorMessage)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [url, initialLimit, checkHasMore, onSuccess, onError, showToast, data])

  // Initial load
  useEffect(() => {
    fetchData(initialPage, false)
  }, []) // Only run once on mount

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchData(page + 1, true)
  }, [hasMore, loading, page, fetchData])

  const reset = useCallback(() => {
    setData([])
    setPage(initialPage)
    setTotal(0)
    setHasMore(true)
    setError(null)
    fetchData(initialPage, false)
  }, [initialPage, fetchData])

  const refetch = useCallback(async () => {
    await fetchData(initialPage, false)
  }, [initialPage, fetchData])

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch,
  }
}
