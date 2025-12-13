/**
 * Universal Flow Execution Helper
 * Integrate flows anywhere in the system
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface FlowExecutionContext {
  context_type: string
  context_id?: string
  input_data?: Record<string, any>
  triggered_by?: string
  triggered_by_type?: 'user' | 'system' | 'webhook' | 'schedule' | 'api'
}

/**
 * Execute flows for a given context
 * This function finds all active flows matching the context and executes them
 */
export async function executeFlowsForContext(
  context: FlowExecutionContext
): Promise<string[]> {
  try {
    // Find active flows that match the context
    const { data: flows, error } = await supabaseAdmin
      .from('flows')
      .select('id, name, trigger_type, trigger_config, module')
      .eq('is_active', true)
      .eq('module', context.context_type === 'whatsapp_conversation' ? 'whatsapp' : context.context_type)
      .order('priority', { ascending: false })

    if (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching flows', error)
      return []
    }

    if (!flows || flows.length === 0) {
      return []
    }

    // Filter flows by trigger conditions
    const matchingFlows = flows.filter(flow => {
      return matchesTrigger(flow, context)
    })

    if (matchingFlows.length === 0) {
      return []
    }

    // Execute all matching flows
    const executionIds: string[] = []
    for (const flow of matchingFlows) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/flows/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flow_id: flow.id,
            ...context,
          }),
        })

        const data = await response.json()
        if (data.success && data.data?.execution_id) {
          executionIds.push(data.data.execution_id)
        }
      } catch (execError) {
        const { logError } = await import('@/shared/utils/logger')
        logError(`Error executing flow ${flow.id}`, execError)
      }
    }

    return executionIds
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error executing flows for context', error)
    return []
  }
}

/**
 * Check if a flow's trigger matches the context
 */
function matchesTrigger(flow: Record<string, unknown>, context: FlowExecutionContext): boolean {
  const triggerType = flow.trigger_type
  const triggerConfig = (flow.trigger_config as Record<string, unknown>) || {}

  switch (triggerType) {
    case 'event':
      // Check if event matches
      const events = Array.isArray(triggerConfig.events) ? triggerConfig.events as string[] : []
      const triggeredBy = (context.triggered_by_type as string) || 'system'
      return events.includes(triggeredBy)

    case 'condition':
      // Evaluate condition against input_data
      const condition = (triggerConfig.condition as string) || ''
      if (!condition) return true
      const conditionInputData = (context.input_data as Record<string, unknown>) || {}
      return evaluateCondition(condition, conditionInputData)

    case 'webhook':
      // Webhook flows are triggered explicitly
      return context.triggered_by_type === 'webhook'

    case 'api_call':
      // API call flows are triggered explicitly
      return context.triggered_by_type === 'api'

    case 'database_change':
      // Database change flows are triggered by database events
      return context.triggered_by_type === 'system'

    case 'user_action':
      // User action flows are triggered by user actions
      return context.triggered_by_type === 'user'

    case 'ai_detection':
      // AI detection flows check for specific patterns in input
      const patterns = Array.isArray(triggerConfig.patterns) ? triggerConfig.patterns as string[] : []
      const aiInputData = context.input_data || {}
      const inputText = JSON.stringify(aiInputData)
      return patterns.some((pattern: string) => 
        inputText.toLowerCase().includes(pattern.toLowerCase())
      )

    default:
      return true
  }
}

/**
 * Simple condition evaluator
 * Supports: {{variable}} == value, {{variable}} != value, etc.
 */
function evaluateCondition(condition: string, data: Record<string, unknown>): boolean {
  try {
    // Replace {{variable}} with actual values
    let resolved = condition
    const matches = condition.match(/\{\{(\w+(?:\.\w+)*)\}\}/g)
    
    if (matches) {
      for (const match of matches) {
        const path = match.replace(/\{\{|\}\}/g, '')
        const keys = path.split('.')
        let value: any = data
        for (const key of keys) {
          value = value?.[key]
          if (value === undefined) return false
        }
        resolved = resolved.replace(match, JSON.stringify(value))
      }
    }

    // Evaluate simple conditions
    if (resolved.includes('==')) {
      const [left, right] = resolved.split('==').map(s => s.trim())
      return left === right
    }
    if (resolved.includes('!=')) {
      const [left, right] = resolved.split('!=').map(s => s.trim())
      return left !== right
    }
    if (resolved.includes('>')) {
      const [left, right] = resolved.split('>').map(s => parseFloat(s.trim()))
      return left > right
    }
    if (resolved.includes('<')) {
      const [left, right] = resolved.split('<').map(s => parseFloat(s.trim()))
      return left < right
    }

    return Boolean(resolved)
  } catch {
    return false
  }
}

/**
 * Execute a specific flow by ID
 */
export async function executeFlowById(
  flowId: string,
  context: FlowExecutionContext
): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/flows/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flow_id: flowId,
        ...context,
      }),
    })

    const data = await response.json()
    if (data.success && data.data?.execution_id) {
      return data.data.execution_id
    }

    return null
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error executing flow', error)
    return null
  }
}

/**
 * Get flow execution status
 */
export async function getFlowExecutionStatus(executionId: string): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('flow_executions')
      .select('*')
      .eq('id', executionId)
      .single()

    if (error) throw error
    return data as Record<string, unknown>
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error fetching flow execution', error)
    return {} as Record<string, unknown>
  }
}
