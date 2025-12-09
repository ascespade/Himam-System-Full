<<<<<<< HEAD
/**
 * Notification Service
 * Centralized service for creating and managing notifications
 */

import { supabaseAdmin } from './supabase'

export type NotificationType = 
  | 'appointment'
  | 'appointment_reminder'
  | 'invoice'
  | 'payment'
  | 'insurance_claim'
  | 'lab_result'
  | 'prescription'
  | 'message'
  | 'system'
  | 'patient_registration'
  | 'doctor_assignment'

export interface CreateNotificationParams {
  userId?: string
  patientId?: string
  type: NotificationType
  title: string
  message: string
  entityType?: string
  entityId?: string
}

/**
 * Create a notification
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: params.userId || null,
        patient_id: params.patientId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Create notification for multiple users (e.g., all admins)
 */
export async function createNotificationForRole(
  role: string,
  params: Omit<CreateNotificationParams, 'userId'>
) {
  try {
    // Get all users with the specified role
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', role)

    if (usersError || !users || users.length === 0) {
      console.error('No users found with role:', role)
      return []
    }

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map(user =>
        createNotification({
          ...params,
          userId: user.id
        })
      )
    )

    return notifications.filter(n => n !== null)
  } catch (error) {
    console.error('Error creating notifications for role:', error)
    return []
  }
}

/**
 * Create notification for specific user by email
 */
export async function createNotificationForUser(
  email: string,
  params: Omit<CreateNotificationParams, 'userId'>
) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.error('User not found:', email)
      return null
    }

    return createNotification({
      ...params,
      userId: user.id
    })
  } catch (error) {
    console.error('Error creating notification for user:', error)
    return null
  }
}

/**
 * Notification templates for common events
 */
export const NotificationTemplates = {
  appointmentCreated: (patientName: string, doctorName: string, date: string) => ({
    type: 'appointment' as NotificationType,
    title: 'موعد جديد',
    message: `تم إنشاء موعد جديد للمريض ${patientName} مع ${doctorName} بتاريخ ${new Date(date).toLocaleDateString('ar-SA')}`
  }),

  appointmentConfirmed: (patientName: string, date: string) => ({
    type: 'appointment' as NotificationType,
    title: 'تم تأكيد الموعد',
    message: `تم تأكيد موعد ${patientName} بتاريخ ${new Date(date).toLocaleDateString('ar-SA')}`
  }),

  appointmentCancelled: (patientName: string, date: string) => ({
    type: 'appointment' as NotificationType,
    title: 'تم إلغاء الموعد',
    message: `تم إلغاء موعد ${patientName} بتاريخ ${new Date(date).toLocaleDateString('ar-SA')}`
  }),

  appointmentReminder: (patientName: string, date: string, time: string) => ({
    type: 'appointment_reminder' as NotificationType,
    title: 'تذكير بالموعد',
    message: `تذكير: موعد ${patientName} غداً في ${time}`
  }),

  invoiceCreated: (patientName: string, amount: number) => ({
    type: 'invoice' as NotificationType,
    title: 'فاتورة جديدة',
    message: `تم إنشاء فاتورة جديدة للمريض ${patientName} بمبلغ ${amount} ريال`
  }),

  paymentReceived: (patientName: string, amount: number) => ({
    type: 'payment' as NotificationType,
    title: 'تم استلام الدفع',
    message: `تم استلام مبلغ ${amount} ريال من ${patientName}`
  }),

  insuranceClaimSubmitted: (patientName: string, amount: number) => ({
    type: 'insurance_claim' as NotificationType,
    title: 'مطالبة تأمين جديدة',
    message: `تم تقديم مطالبة تأمين للمريض ${patientName} بمبلغ ${amount} ريال`
  }),

  insuranceClaimApproved: (patientName: string, amount: number) => ({
    type: 'insurance_claim' as NotificationType,
    title: 'تم الموافقة على المطالبة',
    message: `تمت الموافقة على مطالبة ${patientName} بمبلغ ${amount} ريال`
  }),

  labResultReady: (patientName: string, testName: string) => ({
    type: 'lab_result' as NotificationType,
    title: 'نتائج مختبر جاهزة',
    message: `نتائج ${testName} للمريض ${patientName} جاهزة للمراجعة`
  }),

  prescriptionReady: (patientName: string) => ({
    type: 'prescription' as NotificationType,
    title: 'وصفة طبية جاهزة',
    message: `الوصفة الطبية للمريض ${patientName} جاهزة`
  }),

  newMessage: (from: string) => ({
    type: 'message' as NotificationType,
    title: 'رسالة جديدة',
    message: `رسالة جديدة من ${from}`
  }),

  patientRegistered: (patientName: string) => ({
    type: 'patient_registration' as NotificationType,
    title: 'مريض جديد',
    message: `تم تسجيل مريض جديد: ${patientName}`
  }),

  systemAlert: (message: string) => ({
    type: 'system' as NotificationType,
    title: 'تنبيه النظام',
    message
  })
}

=======
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
>>>>>>> cursor/fix-code-errors-and-warnings-8041
