/**
 * Notifications Hook
 * React hook for managing notifications
 */

'use client'

import { useApi, useMutation } from '@/core/hooks/use-api'
import { API_ROUTES } from '@/shared/constants/api-routes'
import type { Notification } from '@/shared/types'

export interface UseNotificationsOptions {
  unreadOnly?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook for fetching and managing notifications
 */
export function useNotifications(
  userId: string,
  options: UseNotificationsOptions = {}
): UseNotificationsResult {
  const { unreadOnly = false, autoRefresh = false, refreshInterval = 30000 } = options

  const url = `${API_ROUTES.NOTIFICATIONS}?userId=${userId}${unreadOnly ? '&unreadOnly=true' : ''}`

  const { data, loading, error, refetch } = useApi<{
    data: Notification[]
    total: number
    unreadCount: number
  }>(url, {
    immediate: true,
    showToast: false,
  })

  const { mutate: markAsReadMutation } = useMutation<Notification, { id: string }>(
    API_ROUTES.NOTIFICATIONS,
    'PATCH',
    {
      showToast: false,
      onSuccess: () => {
        refetch()
      },
    }
  )

  const { mutate: markAllAsReadMutation } = useMutation<{ count: number }, void>(
    API_ROUTES.NOTIFICATIONS_MARK_ALL_READ,
    'POST',
    {
      showToast: true,
      onSuccess: () => {
        refetch()
      },
    }
  )

  const { mutate: deleteMutation } = useMutation<void, { id: string }>(
    API_ROUTES.NOTIFICATIONS,
    'DELETE',
    {
      showToast: false,
      onSuccess: () => {
        refetch()
      },
    }
  )

  const markAsRead = async (id: string) => {
    await markAsReadMutation({ id })
  }

  const markAllAsRead = async () => {
    await markAllAsReadMutation(undefined)
  }

  const deleteNotification = async (id: string) => {
    await deleteMutation({ id })
  }

  return {
    notifications: data?.data || [],
    unreadCount: data?.unreadCount || 0,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  }
}
