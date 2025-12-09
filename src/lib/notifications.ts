/**
 * Notification Service
 * Handles creating and managing notifications
 */

import { supabaseAdmin } from './supabase'

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'critical'

export interface CreateNotificationInput {
  userId: string
  title: string
  message: string
  type?: NotificationType
  entityType?: string
  entityId?: string
  read?: boolean
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  entity_type: string | null
  entity_id: string | null
  read: boolean
  created_at: string
  updated_at: string | null
}

/**
 * Create a new notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      read: input.read || false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`)
  }

  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    message: data.message,
    type: data.type as NotificationType,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    read: data.read,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/**
 * Notification templates for common scenarios
 */
export const NotificationTemplates = {
  appointmentBooked: (patientName: string, date: string, time: string) => ({
    title: 'تم حجز موعد جديد',
    message: `تم حجز موعد للمريض ${patientName} في ${date} الساعة ${time}`,
    type: 'success' as NotificationType,
  }),

  appointmentCancelled: (patientName: string, date: string) => ({
    title: 'تم إلغاء موعد',
    message: `تم إلغاء موعد للمريض ${patientName} في ${date}`,
    type: 'warning' as NotificationType,
  }),

  criticalCase: (patientName: string) => ({
    title: 'حالة حرجة',
    message: `تم تسجيل حالة حرجة للمريض ${patientName}`,
    type: 'critical' as NotificationType,
  }),

  newMessage: (senderName: string) => ({
    title: 'رسالة جديدة',
    message: `رسالة جديدة من ${senderName}`,
    type: 'info' as NotificationType,
  }),
}
