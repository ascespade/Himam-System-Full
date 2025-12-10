/**
 * Notification Service
 * Centralized notification management
 */

import { BaseService, ServiceException } from '@/core/services'
import type { Notification } from '@/shared/types'
import type { CreateNotificationInput } from './notification.templates'

export class NotificationService extends BaseService {
  /**
   * Creates a new notification
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    // Validate required fields
    if (!input.type || !input.title || !input.message) {
      throw new ServiceException('Missing required fields: type, title, message', 'VALIDATION_ERROR')
    }

    const { data: notification, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        patient_id: input.patientId,
        type: input.type,
        title: input.title,
        message: input.message,
        entity_type: input.entityType,
        entity_id: input.entityId,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw this.handleError(error, 'createNotification')
    }

    return this.requireData(notification, 'Failed to create notification')
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const { data: notification, error } = await this.supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      throw this.handleError(error, 'markAsRead')
    }

    return this.requireData(notification, 'Notification not found')
  }

  /**
   * Marks all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()

    if (error) {
      throw this.handleError(error, 'markAllAsRead')
    }

    return data?.length || 0
  }

  /**
   * Gets notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean
      page?: number
      limit?: number
    } = {}
  ): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const { unreadOnly = false, page = 1, limit = 50 } = options
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw this.handleError(error, 'getNotifications')
    }

    // Get unread count
    const { count: unreadCount } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return {
      data: data || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
    }
  }

  /**
   * Deletes a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      throw this.handleError(error, 'deleteNotification')
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
