/**
 * Notifications Index
 * Centralized export for notification system
 */

export { NotificationService, notificationService } from './notification.service'
export { NotificationTemplates, createNotificationFromTemplate, type CreateNotificationInput } from './notification.templates'
export { useNotifications, type UseNotificationsOptions, type UseNotificationsResult } from './use-notifications'
