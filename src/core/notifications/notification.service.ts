/**
 * Notification Service
 * Centralized notification management
 */

import { BaseService, ServiceException } from '@/core/services'
import { supabaseAdmin } from '@/lib'
import { logError } from '@/shared/utils/logger'
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

    const { data: notification, error } = await supabaseAdmin
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
      logError('Error creating notification', error, { input })
      throw new ServiceException('Failed to create notification', 'NOTIFICATION_CREATE_ERROR')
    }

    if (!notification) {
      throw new ServiceException('Failed to create notification', 'NOTIFICATION_CREATE_ERROR')
    }

    return notification as Notification
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      logError('Error marking notification as read', error, { notificationId })
      throw new ServiceException('Failed to mark notification as read', 'NOTIFICATION_UPDATE_ERROR')
    }

    if (!notification) {
      throw new ServiceException('Notification not found', 'NOT_FOUND')
    }
    return notification as Notification
  }

  /**
   * Marks all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()

    if (error) {
      logError('Error marking all notifications as read', error, { userId })
      throw new ServiceException('Failed to mark all notifications as read', 'NOTIFICATION_UPDATE_ERROR')
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

    let query = supabaseAdmin
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
      logError('Error getting notifications', error, { userId, options })
      throw new ServiceException('Failed to get notifications', 'NOTIFICATION_FETCH_ERROR')
    }

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
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
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      logError('Error deleting notification', error, { notificationId })
      throw new ServiceException('Failed to delete notification', 'NOTIFICATION_DELETE_ERROR')
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
