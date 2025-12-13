/**
 * Activity Logger
 * نظام تسجيل الأنشطة الشامل
 * يتم استدعاؤه تلقائياً من جميع APIs
 */

import { supabaseAdmin } from './supabase'

export interface ActivityLogParams {
  userId: string
  userRole: string
  actionType: string
  entityType?: string
  entityId?: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Log activity
 */
export async function logActivity(params: ActivityLogParams) {
  try {
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        user_role: params.userRole,
        action_type: params.actionType,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        description: params.description,
        metadata: params.metadata || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null
      })
  } catch (error) {
    // Don't throw - logging should never break the main flow
    const { logError } = await import('@/shared/utils/logger')
    logError('Failed to log activity', error)
  }
}

/**
 * Helper to get IP and User Agent from request
 */
export function getRequestInfo(req: Request): { ipAddress: string; userAgent: string } {
  const ipAddress = 
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  
  const userAgent = req.headers.get('user-agent') || 'unknown'

  return { ipAddress, userAgent }
}

