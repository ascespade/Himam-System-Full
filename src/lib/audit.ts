import { supabaseAdmin } from './supabase'

export async function logAudit(
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  details?: any,
  req?: Request
) {
  try {
    let ipAddress = 'unknown'
    let userAgent = 'unknown'

    if (req) {
      ipAddress = req.headers.get('x-forwarded-for') || 'unknown'
      userAgent = req.headers.get('user-agent') || 'unknown'
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    })
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Audit log failed', error)
    // Don't throw error to prevent blocking main flow
  }
}
