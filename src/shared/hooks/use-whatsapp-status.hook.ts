'use client'

/**
 * Unified WhatsApp Status Hook
 * React hook for checking WhatsApp status across all pages
 */

import { useState, useEffect, useCallback } from 'react'

export type WhatsAppStatus = 'connected' | 'disconnected' | 'checking' | 'pending'

export interface WhatsAppStatusResult {
  status: WhatsAppStatus
  message?: string
  settings?: {
    hasToken: boolean
    hasPhoneNumberId: boolean
    isActive: boolean
  }
  lastChecked?: string
}

export interface WhatsAppStats {
  totalMessages: number
  activeConversations: number
  templatesCount: number
  deliveryRate: number
  responseTime: number
  status: WhatsAppStatus
}

interface UseWhatsAppStatusOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  includeStats?: boolean
}

/**
 * Hook to get WhatsApp connection status
 */
export function useWhatsAppStatus(options: UseWhatsAppStatusOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000, includeStats = false } = options

  const [status, setStatus] = useState<WhatsAppStatusResult>({
    status: 'checking',
  })
  const [stats, setStats] = useState<WhatsAppStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (includeStats) {
        // Fetch stats (which includes status)
        const res = await fetch('/api/whatsapp/stats')
        if (!res.ok) {
          throw new Error('Failed to fetch WhatsApp stats')
        }
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
          setStatus({
            status: data.data.status,
            message: data.data.status === 'connected' ? 'Connected' : 'Disconnected',
          })
        } else {
          throw new Error(data.error || 'Failed to fetch stats')
        }
      } else {
        // Fetch status only
        const res = await fetch('/api/whatsapp/status')
        if (!res.ok) {
          throw new Error('Failed to fetch WhatsApp status')
        }
        const data = await res.json()
        if (data.success) {
          setStatus(data.data)
        } else {
          throw new Error(data.error || 'Failed to fetch status')
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status'
      console.error('Error fetching WhatsApp status:', err)
      setError(errorMessage)
      setStatus({
        status: 'disconnected',
        message: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }, [includeStats])

  useEffect(() => {
    fetchStatus()

    if (autoRefresh) {
      const interval = setInterval(fetchStatus, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchStatus, autoRefresh, refreshInterval])

  return {
    status,
    stats,
    loading,
    error,
    refetch: fetchStatus,
  }
}

