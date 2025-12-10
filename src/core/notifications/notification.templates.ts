/**
 * Notification Templates
 * Centralized notification message templates
 */

export const NotificationTemplates = {
  APPOINTMENT_CREATED: {
    type: 'appointment_created',
    title: (params?: Record<string, unknown>) => `تم إنشاء موعد جديد`,
    message: (params?: Record<string, unknown>) =>
      `تم إنشاء موعد جديد للمريض ${params?.patientName || ''} في ${params?.date || ''}`,
  },

  APPOINTMENT_CONFIRMED: {
    type: 'appointment_confirmed',
    title: (params?: Record<string, unknown>) => `تم تأكيد الموعد`,
    message: (params?: Record<string, unknown>) =>
      `تم تأكيد موعدك في ${params?.date || ''} الساعة ${params?.time || ''}`,
  },

  APPOINTMENT_CANCELLED: {
    type: 'appointment_cancelled',
    title: (params?: Record<string, unknown>) => `تم إلغاء الموعد`,
    message: (params?: Record<string, unknown>) => `تم إلغاء موعدك في ${params?.date || ''}`,
  },

  APPOINTMENT_REMINDER: {
    type: 'appointment_reminder',
    title: (params?: Record<string, unknown>) => `تذكير بالموعد`,
    message: (params?: Record<string, unknown>) =>
      `تذكير: لديك موعد غداً في ${params?.date || ''} الساعة ${params?.time || ''}`,
  },

  PRESCRIPTION_READY: {
    type: 'prescription_ready',
    title: (params?: Record<string, unknown>) => `الوصفة الطبية جاهزة`,
    message: (params?: Record<string, unknown>) => `الوصفة الطبية الخاصة بك جاهزة للمراجعة`,
  },

  LAB_RESULT_READY: {
    type: 'lab_result_ready',
    title: (params?: Record<string, unknown>) => `نتائج الفحوصات جاهزة`,
    message: (params?: Record<string, unknown>) => `نتائج الفحوصات الخاصة بك جاهزة للمراجعة`,
  },

  PAYMENT_RECEIVED: {
    type: 'payment_received',
    title: (params?: Record<string, unknown>) => `تم استلام الدفع`,
    message: (params?: Record<string, unknown>) => `تم استلام مبلغ ${params?.amount || 0} ريال`,
  },

  PAYMENT_DUE: {
    type: 'payment_due',
    title: (params?: Record<string, unknown>) => `فاتورة مستحقة الدفع`,
    message: (params?: Record<string, unknown>) => `لديك فاتورة مستحقة الدفع بقيمة ${params?.amount || 0} ريال`,
  },

  SYSTEM_UPDATE: {
    type: 'system_update',
    title: (params?: Record<string, unknown>) => `تحديث النظام`,
    message: (params?: Record<string, unknown>) => `تحديث النظام: ${params?.update || ''}`,
  },

  WELCOME: {
    type: 'welcome',
    title: (params?: Record<string, unknown>) => `مرحباً بك`,
    message: (params?: Record<string, unknown>) => `مرحباً ${params?.name || ''}، شكراً لانضمامك إلينا`,
  },
} as const

export interface CreateNotificationInput {
  userId?: string
  patientId?: string
  type: string
  title: string
  message: string
  entityType?: string
  entityId?: string
}

/**
 * Creates a notification using a template
 */
export function createNotificationFromTemplate(
  template: typeof NotificationTemplates[keyof typeof NotificationTemplates],
  params: Record<string, string | number> = {},
  options: {
    userId?: string
    patientId?: string
    entityType?: string
    entityId?: string
  } = {}
): CreateNotificationInput {
  return {
    type: template.type,
    title: template.title(params),
    message: template.message(params),
    userId: options.userId,
    patientId: options.patientId,
    entityType: options.entityType,
    entityId: options.entityId,
  }
}
