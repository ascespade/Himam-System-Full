/**
 * Unified WhatsApp Status Service
 * Centralized service for checking WhatsApp connection status
 * Uses singleton pattern for consistent state management across all pages
 */

import { supabaseAdmin } from '@/lib/supabase'
import { logError, logInfo, logWarn } from '@/shared/utils/logger'

const META_API_VERSION = 'v20.0'
const CACHE_DURATION_MS = 30000 // 30 seconds

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

class WhatsAppStatusService {
  private cache: {
    status?: WhatsAppStatusResult
    stats?: WhatsAppStats
    lastChecked?: number
  } = {}

  private isCacheValid(): boolean {
    if (!this.cache.lastChecked) return false
    return Date.now() - this.cache.lastChecked < CACHE_DURATION_MS
  }

  /**
   * Check WhatsApp connection status
   * Uses the same logic as the settings page checkConnection function
   */
  async checkStatus(): Promise<WhatsAppStatusResult> {
    try {
      // Return cached result if valid
      if (this.cache.status && this.isCacheValid()) {
        return this.cache.status
      }

      // First check if we have active settings (same as settings page)
      const { data: activeSettings, error: activeError } = await supabaseAdmin
        .from('whatsapp_settings')
        .select('is_active, access_token, phone_number_id')
        .eq('is_active', true)
        .single()

      if (activeError || !activeSettings || !activeSettings.is_active) {
        const result: WhatsAppStatusResult = {
          status: 'disconnected',
          message: 'WhatsApp settings not active',
          settings: {
            hasToken: false,
            hasPhoneNumberId: false,
            isActive: false,
          },
        }
        this.cache.status = result
        this.cache.lastChecked = Date.now()
        return result
      }

      // Test connection by making a direct call to Meta API
      const result = await this.testMetaAPIConnection(
        activeSettings.phone_number_id,
        activeSettings.access_token
      )
      
      this.cache.status = result
      this.cache.lastChecked = Date.now()
      return result
    } catch (error) {
      logError('Error checking WhatsApp status', error)
      const result: WhatsAppStatusResult = {
        status: 'disconnected',
        message: 'Error checking WhatsApp status',
      }
      this.cache.status = result
      this.cache.lastChecked = Date.now()
      return result
    }
  }

  /**
   * Test Meta API connection
   */
  private async testMetaAPIConnection(
    phoneNumberId: string,
    accessToken: string
  ): Promise<WhatsAppStatusResult> {
    try {
      const apiUrl = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}?fields=verified_name`
      const testResponse = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (testResponse.ok) {
        const testData = await testResponse.json().catch(() => ({}))
        if (testData.verified_name || testData.id) {
          logInfo('WhatsApp connection verified')
          return {
            status: 'connected',
            message: 'WhatsApp is connected and active',
            settings: {
              hasToken: true,
              hasPhoneNumberId: true,
              isActive: true,
            },
            lastChecked: new Date().toISOString(),
          }
        }
      }

      logWarn('WhatsApp API connection failed', { status: testResponse.status })
      return {
        status: 'disconnected',
        message: 'Failed to connect to WhatsApp API',
        settings: {
          hasToken: true,
          hasPhoneNumberId: true,
          isActive: true,
        },
      }
    } catch (apiError) {
      logError('Error connecting to WhatsApp API', apiError)
      return {
        status: 'disconnected',
        message: 'Error connecting to WhatsApp API',
        settings: {
          hasToken: true,
          hasPhoneNumberId: true,
          isActive: true,
        },
      }
    }
  }

  /**
   * Get comprehensive WhatsApp stats
   */
  async getStats(): Promise<WhatsAppStats> {
    try {
      // Return cached stats if valid
      if (this.cache.stats && this.isCacheValid()) {
        return this.cache.stats
      }

      // Get status first
      const statusResult = await this.checkStatus()

      // Get message statistics
      const { data: messages } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('id, status, direction, created_at')
        .order('created_at', { ascending: false })
        .limit(1000)

      const totalMessages = messages?.length || 0
      const deliveredMessages = messages?.filter((m) => m.status === 'delivered' || m.status === 'sent').length || 0
      const deliveryRate = totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0

      // Get active conversations
      const { data: conversations } = await supabaseAdmin
        .from('whatsapp_conversations')
        .select('id')
        .eq('status', 'active')

      const activeConversations = conversations?.length || 0

      // Get templates count
      const { data: templates } = await supabaseAdmin
        .from('whatsapp_templates')
        .select('id')
        .eq('status', 'approved')

      const templatesCount = templates?.length || 0

      // Calculate average response time
      let totalResponseTime = 0
      let responseCount = 0

      if (messages && messages.length > 0) {
        const inboundByPhone = new Map<string, any[]>()
        messages
          .filter((m) => m.direction === 'inbound')
          .forEach((m: any) => {
            const phone = m.from_phone || m.to_phone
            if (!inboundByPhone.has(phone)) {
              inboundByPhone.set(phone, [])
            }
            inboundByPhone.get(phone)!.push(m)
          })

        messages
          .filter((m) => m.direction === 'outbound')
          .forEach((outbound: any) => {
            const phone = outbound.to_phone || outbound.from_phone
            const inboundMessages = inboundByPhone.get(phone) || []
            const lastInbound = inboundMessages
              .filter((inbound: any) => new Date(inbound.created_at) < new Date(outbound.created_at))
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

            if (lastInbound) {
              const responseTime = new Date(outbound.created_at).getTime() - new Date(lastInbound.created_at).getTime()
              totalResponseTime += responseTime
              responseCount++
            }
          })
      }

      const avgResponseTimeSeconds = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000) : 0

      const stats: WhatsAppStats = {
        totalMessages,
        activeConversations,
        templatesCount,
        deliveryRate,
        responseTime: avgResponseTimeSeconds,
        status: statusResult.status,
      }

      this.cache.stats = stats
      this.cache.lastChecked = Date.now()

      return stats
    } catch (error) {
      logError('Error getting WhatsApp stats', error)
      return {
        totalMessages: 0,
        activeConversations: 0,
        templatesCount: 0,
        deliveryRate: 0,
        responseTime: 0,
        status: 'disconnected',
      }
    }
  }

  /**
   * Clear cache (useful after settings update)
   */
  clearCache(): void {
    this.cache = {}
  }
}

export const whatsappStatusService = new WhatsAppStatusService()

