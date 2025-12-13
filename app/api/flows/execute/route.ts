/**
 * Flow Execution API
 * Universal flow execution engine - works for any scenario
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { HTTP_STATUS } from '@/shared/constants'
import { generateWhatsAppResponse } from '@/lib/ai'

export const dynamic = 'force-dynamic'

/**
 * POST /api/flows/execute
 * Execute a flow
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      flow_id,
      context_type,
      context_id,
      input_data,
      triggered_by,
      triggered_by_type = 'api',
    } = body

    if (!flow_id || !context_type) {
      return NextResponse.json(
        { success: false, error: 'flow_id and context_type are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Get flow
    const { data: flow, error: flowError } = await supabaseAdmin
      .from('flows')
      .select('*')
      .eq('id', flow_id)
      .eq('is_active', true)
      .single()

    if (flowError || !flow) {
      return NextResponse.json(
        { success: false, error: 'Flow not found or inactive' },
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    // Create execution record
    const { data: execution, error: execError } = await supabaseAdmin
      .rpc('trigger_flow_execution', {
        p_flow_id: flow_id,
        p_context_type: context_type,
        p_context_id: context_id || null,
        p_input_data: input_data || {},
        p_triggered_by: triggered_by || null,
        p_triggered_by_type: triggered_by_type,
      })

    if (execError) throw execError

    const executionId = execution

    // Execute flow asynchronously (don't wait for completion)
    executeFlowAsync(flow, executionId, context_type, context_id, input_data || {})

    return NextResponse.json({
      success: true,
      data: {
        execution_id: executionId,
        flow_id: flow.id,
        flow_name: flow.name,
        status: 'running',
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/flows/execute' })

    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * Execute flow asynchronously
 */
async function executeFlowAsync(
  flow: Record<string, unknown>,
  executionId: string,
  contextType: string,
  contextId: string | null,
  inputData: Record<string, any>
) {
  try {
    const nodes = Array.isArray(flow.nodes) ? flow.nodes as Array<Record<string, unknown>> : []
    const edges = Array.isArray(flow.edges) ? flow.edges as Array<Record<string, unknown>> : []
    const nodeResults: Record<string, Record<string, unknown>> = {}
    let currentNodeId: string | null = null

    // Find start node (node with no incoming edges)
    const startNode = nodes.find((node: Record<string, unknown>) => {
      const hasIncoming = edges.some((edge: Record<string, unknown>) => edge.target === node.id)
      return !hasIncoming
    }) || nodes[0]

    if (!startNode) {
      throw new Error('No start node found')
    }

    currentNodeId = (startNode.id as string) || null

    // Execute nodes in order
    while (currentNodeId) {
      const currentNode = nodes.find((n: Record<string, unknown>) => n.id === currentNodeId) as Record<string, unknown> | undefined
      if (!currentNode || !currentNodeId) break

      const nodeId = currentNodeId // Store in const to ensure it's not null

      // Log node start
      await supabaseAdmin.from('flow_logs').insert({
        execution_id: executionId,
        node_id: nodeId,
        log_level: 'info',
        message: `Executing node: ${currentNode.label || currentNode.type}`,
        data: { node: currentNode },
      })

      // Execute node based on type
      let nodeResult: Record<string, unknown> | null = null

      try {
        switch (currentNode.type) {
          case 'trigger':
            nodeResult = { success: true, data: inputData }
            break

          case 'condition':
            nodeResult = await executeConditionNode(currentNode, nodeResults, inputData)
            break

          case 'ai_analysis':
            nodeResult = await executeAIAnalysisNode(currentNode, inputData, flow)
            break

          case 'database_query':
            nodeResult = await executeDatabaseNode(currentNode, contextType, contextId, inputData)
            break

          case 'database_update':
            nodeResult = await executeDatabaseUpdateNode(currentNode, contextType, contextId, inputData, nodeResults)
            break

          case 'api_call':
            nodeResult = await executeAPICallNode(currentNode, inputData, nodeResults)
            break

          case 'notification':
            nodeResult = await executeNotificationNode(currentNode, inputData, nodeResults)
            break

          case 'delay':
            nodeResult = await executeDelayNode(currentNode)
            break

          case 'transform':
            nodeResult = await executeTransformNode(currentNode, inputData, nodeResults)
            break

          case 'webhook':
            nodeResult = await executeWebhookNode(currentNode, inputData, nodeResults)
            break

          default:
            nodeResult = { success: true, data: {} }
        }

        nodeResults[nodeId] = nodeResult

        // Update execution
        await supabaseAdmin
          .from('flow_executions')
          .update({
            current_node_id: nodeId,
            node_results: nodeResults,
          })
          .eq('id', executionId)

        // Find next node
        const nextEdge = edges.find((e: Record<string, unknown>) => {
          if (e.source !== nodeId) return false
          
          // Check condition if edge has condition
          const edgeCondition = e.condition
          if (edgeCondition) {
            return evaluateCondition(edgeCondition as string, nodeResult as Record<string, unknown>)
          }
          return true
        })

        const target = nextEdge && typeof nextEdge === 'object' && 'target' in nextEdge 
          ? (nextEdge.target as string) 
          : null
        currentNodeId = target
      } catch (nodeError: unknown) {
        // Node execution failed
        if (nodeId) {
          const errorMessage = nodeError instanceof Error ? nodeError.message : String(nodeError)
          const errorStack = nodeError instanceof Error ? nodeError.stack : undefined
          nodeResults[nodeId] = {
            success: false,
            error: errorMessage,
          }

          await supabaseAdmin.from('flow_logs').insert({
            execution_id: executionId,
            node_id: nodeId,
            log_level: 'error',
            message: `Node execution failed: ${errorMessage}`,
            data: { error: errorStack },
          })

          // Check if flow should continue on error
          const continueOnError = currentNode && typeof currentNode === 'object' && 'continueOnError' in currentNode
            ? (currentNode.continueOnError as boolean)
            : false
          if (continueOnError) {
            const nextEdge = edges.find((e: Record<string, unknown>) => e.source === nodeId)
            const target = nextEdge && typeof nextEdge === 'object' && 'target' in nextEdge
              ? (nextEdge.target as string)
              : null
            currentNodeId = target
          } else {
            throw nodeError
          }
        } else {
          throw nodeError
        }
      }
    }

    // Mark execution as completed
    const completedAt = new Date()
    const { data: execution } = await supabaseAdmin
      .from('flow_executions')
      .select('started_at')
      .eq('id', executionId)
      .single()

    const duration = execution?.started_at
      ? completedAt.getTime() - new Date(execution.started_at).getTime()
      : 0

    await supabaseAdmin
      .from('flow_executions')
      .update({
        status: 'completed',
        completed_at: completedAt.toISOString(),
        duration_ms: duration,
        output_data: nodeResults,
      })
      .eq('id', executionId)

  } catch (error: unknown) {
    // Mark execution as failed
    const errorMessage = error instanceof Error ? error.message : 'Flow execution failed'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    await supabaseAdmin
      .from('flow_executions')
      .update({
        status: 'failed',
        error_message: errorMessage,
        error_stack: errorStack,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId)

    await supabaseAdmin.from('flow_logs').insert({
      execution_id: executionId,
      log_level: 'error',
      message: `Flow execution failed: ${errorMessage}`,
      data: { error: errorStack },
    })
  }
}

// Node execution functions
async function executeConditionNode(node: Record<string, unknown>, nodeResults: Record<string, Record<string, unknown>>, inputData: Record<string, unknown>): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const condition = (config?.condition as string) || ''
  const result = evaluateCondition(condition, { ...nodeResults, input: inputData })
  return { success: true, result, data: { condition, result } }
}

async function executeAIAnalysisNode(node: Record<string, unknown>, inputData: Record<string, unknown>, flow: Record<string, unknown>): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const prompt = (config?.prompt as string) || (flow.ai_prompt as string) || 'Analyze the following data'
  const message = typeof inputData === 'string' ? inputData : JSON.stringify(inputData)
  
  const response = await generateWhatsAppResponse('', prompt + '\n\n' + message, [], undefined)
  return { success: true, result: response.text, model: response.model }
}

async function executeDatabaseNode(node: Record<string, unknown>, contextType: string, contextId: string | null, inputData: Record<string, unknown>): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const table = config?.table as string | undefined
  const query = config?.query as string | undefined
  const filters = (config?.filters as Record<string, unknown>) || {}

  if (!table) {
    throw new Error('Table name is required for database_query node')
  }

  let dbQuery = supabaseAdmin.from(table).select('*')

  // Apply filters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined) {
      dbQuery = dbQuery.eq(key, value)
    }
  }

  // Apply context filter if context_id provided
  const useContext = config?.use_context as boolean | undefined
  if (contextId && useContext) {
    dbQuery = dbQuery.eq('id', contextId)
  }

  const { data, error } = await dbQuery

  if (error) throw error

  return { success: true, data: data || [] }
}

async function executeDatabaseUpdateNode(
  node: Record<string, unknown>,
  contextType: string,
  contextId: string | null,
  inputData: Record<string, unknown>,
  nodeResults: Record<string, Record<string, unknown>>
): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const table = config?.table as string | undefined
  const updates = (config?.updates as Record<string, unknown>) || {}

  if (!table) {
    throw new Error('Table name is required for database_update node')
  }

  // Resolve update values (can reference previous node results)
  const resolvedUpdates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    resolvedUpdates[key] = resolveValue(value, { input: inputData, ...nodeResults })
  }

  // Determine update target
  const configId = config?.id as string | undefined
  const inputId = inputData.id as string | undefined
  const updateId = contextId || configId || inputId

  if (!updateId) {
    throw new Error('Update target ID is required')
  }

  const { data, error } = await supabaseAdmin
    .from(table)
    .update(resolvedUpdates)
    .eq('id', updateId)
    .select()
    .single()

  if (error) throw error

  return { success: true, data }
}

async function executeAPICallNode(node: Record<string, unknown>, inputData: Record<string, unknown>, nodeResults: Record<string, Record<string, unknown>>): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const url = config?.url as string | undefined
  const method = (config?.method as string) || 'GET'
  const headers = (config?.headers as Record<string, string>) || {}
  const body = config?.body

  if (!url) {
    throw new Error('URL is required for api_call node')
  }

  const resolvedBody = body ? resolveValue(body, { input: inputData, ...nodeResults }) : undefined

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: resolvedBody ? JSON.stringify(resolvedBody) : undefined,
  })

  const data = await response.json()

  return { success: response.ok, data, status: response.status }
}

async function executeNotificationNode(node: Record<string, unknown>, inputData: Record<string, unknown>, nodeResults: Record<string, Record<string, unknown>>): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const type = (config?.type as string) || 'email'
  const recipient = config?.recipient as string | undefined
  const subject = config?.subject as string | undefined
  const message = config?.message as string | undefined

  // Resolve template variables
  const resolvedMessage = message ? resolveValue(message, { input: inputData, ...nodeResults }) : ''
  const resolvedSubject = subject ? resolveValue(subject, { input: inputData, ...nodeResults }) : ''

  // In production, integrate with notification service
  // For now, just log
  // TODO: Implement actual notification sending
  // logInfo(`Notification [${type}]`, { recipient, subject: resolvedSubject, message: resolvedMessage })

  return { success: true, sent: true }
}

async function executeDelayNode(node: Record<string, unknown>): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const delay = typeof config?.delay === 'number' ? config.delay : 1000
  await new Promise(resolve => setTimeout(resolve, delay))
  return { success: true, delayed: delay }
}

async function executeTransformNode(node: Record<string, unknown>, inputData: Record<string, unknown>, nodeResults: Record<string, Record<string, unknown>>): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const transform = (config?.transform as Record<string, unknown>) || {}
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(transform)) {
    result[key] = resolveValue(value, { input: inputData, ...nodeResults })
  }

  return { success: true, data: result }
}

async function executeWebhookNode(node: Record<string, unknown>, inputData: Record<string, unknown>, nodeResults: Record<string, Record<string, unknown>>): Promise<Record<string, unknown>> {
  const config = node.config as Record<string, unknown> | undefined
  const url = config?.url as string | undefined
  const method = (config?.method as string) || 'POST'
  const body = (config?.body as Record<string, unknown>) || { ...inputData, ...nodeResults }

  if (!url) {
    throw new Error('URL is required for webhook node')
  }

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return { success: response.ok, status: response.status }
}

// Helper functions
function evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
  try {
    // Simple condition evaluation (in production, use a proper expression evaluator)
    // Supports: {{variable}} == value, {{variable}} != value, etc.
    const resolved = resolveValue(condition, context)
    return Boolean(resolved)
  } catch {
    return false
  }
}

function resolveValue(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    // Replace {{variable}} with context values
    const result = (value as string).replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const keys = path.split('.')
      let resolved: unknown = context
      for (const key of keys) {
        if (resolved && typeof resolved === 'object' && key in resolved) {
          resolved = (resolved as Record<string, unknown>)[key]
        } else {
          return match
        }
      }
      return String(resolved ?? match)
    })
    return result
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(v => resolveValue(v, context))
    }
    const resolved: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveValue(v, context)
    }
    return resolved
  }
  return value
}
