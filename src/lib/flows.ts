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
      console.error('Error fetching flows:', error)
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
        console.error(`Error executing flow ${flow.id}:`, execError)
      }
    }

    return executionIds
  } catch (error) {
    console.error('Error executing flows for context:', error)
    return []
  }
}

/**
 * Check if a flow's trigger matches the context
 */
function matchesTrigger(flow: any, context: FlowExecutionContext): boolean {
  const triggerType = flow.trigger_type
  const triggerConfig = flow.trigger_config || {}

  switch (triggerType) {
    case 'event':
      // Check if event matches
      const events = triggerConfig.events || []
      return events.includes(context.triggered_by_type || 'system')

    case 'condition':
      // Evaluate condition against input_data
      const condition = triggerConfig.condition || ''
      if (!condition) return true
      return evaluateCondition(condition, context.input_data || {})

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
      const patterns = triggerConfig.patterns || []
      const inputText = JSON.stringify(context.input_data || {})
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
function evaluateCondition(condition: string, data: Record<string, any>): boolean {
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
    console.error('Error executing flow:', error)
    return null
  }
}

/**
 * Get flow execution status
 */
export async function getFlowExecutionStatus(executionId: string): Promise<any> {
  try {
    const { data, error } = await supabaseAdmin
      .from('flow_executions')
      .select('*')
      .eq('id', executionId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching flow execution:', error)
    return null
  }
}
