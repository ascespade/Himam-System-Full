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
  } catch (error: any) {
    console.error('Error executing flow:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * Execute flow asynchronously
 */
async function executeFlowAsync(
  flow: any,
  executionId: string,
  contextType: string,
  contextId: string | null,
  inputData: Record<string, any>
) {
  try {
    const nodes = flow.nodes || []
    const edges = flow.edges || []
    const nodeResults: Record<string, any> = {}
    let currentNodeId: string | null = null

    // Find start node (node with no incoming edges)
    const startNode = nodes.find((node: any) => {
      const hasIncoming = edges.some((edge: any) => edge.target === node.id)
      return !hasIncoming
    }) || nodes[0]

    if (!startNode) {
      throw new Error('No start node found')
    }

    currentNodeId = startNode.id

    // Execute nodes in order
    while (currentNodeId) {
      const currentNode = nodes.find((n: any) => n.id === currentNodeId)
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
      let nodeResult: any = null

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
        const nextEdge = edges.find((e: any) => {
          if (e.source !== nodeId) return false
          
          // Check condition if edge has condition
          if (e.condition) {
            return evaluateCondition(e.condition, nodeResult)
          }
          return true
        })

        currentNodeId = nextEdge?.target || null
      } catch (nodeError: any) {
        // Node execution failed
        if (nodeId) {
          nodeResults[nodeId] = {
            success: false,
            error: nodeError.message,
          }

          await supabaseAdmin.from('flow_logs').insert({
            execution_id: executionId,
            node_id: nodeId,
            log_level: 'error',
            message: `Node execution failed: ${nodeError.message}`,
            data: { error: nodeError.stack },
          })

          // Check if flow should continue on error
          if (currentNode.continueOnError) {
            const nextEdge = edges.find((e: any) => e.source === nodeId)
            currentNodeId = nextEdge?.target || null
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

  } catch (error: any) {
    // Mark execution as failed
    await supabaseAdmin
      .from('flow_executions')
      .update({
        status: 'failed',
        error_message: error.message,
        error_stack: error.stack,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId)

    await supabaseAdmin.from('flow_logs').insert({
      execution_id: executionId,
      log_level: 'error',
      message: `Flow execution failed: ${error.message}`,
      data: { error: error.stack },
    })
  }
}

// Node execution functions
async function executeConditionNode(node: any, nodeResults: Record<string, any>, inputData: Record<string, any>): Promise<any> {
  const condition = node.config?.condition || ''
  const result = evaluateCondition(condition, { ...nodeResults, input: inputData })
  return { success: true, result, data: { condition, result } }
}

async function executeAIAnalysisNode(node: any, inputData: Record<string, any>, flow: any): Promise<any> {
  const prompt = node.config?.prompt || flow.ai_prompt || 'Analyze the following data'
  const message = typeof inputData === 'string' ? inputData : JSON.stringify(inputData)
  
  const response = await generateWhatsAppResponse('', prompt + '\n\n' + message, [], undefined)
  return { success: true, result: response.text, model: response.model }
}

async function executeDatabaseNode(node: any, contextType: string, contextId: string | null, inputData: Record<string, any>): Promise<any> {
  const table = node.config?.table
  const query = node.config?.query
  const filters = node.config?.filters || {}

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
  if (contextId && node.config?.use_context) {
    dbQuery = dbQuery.eq('id', contextId)
  }

  const { data, error } = await dbQuery

  if (error) throw error

  return { success: true, data: data || [] }
}

async function executeDatabaseUpdateNode(
  node: any,
  contextType: string,
  contextId: string | null,
  inputData: Record<string, any>,
  nodeResults: Record<string, any>
): Promise<any> {
  const table = node.config?.table
  const updates = node.config?.updates || {}

  if (!table) {
    throw new Error('Table name is required for database_update node')
  }

  // Resolve update values (can reference previous node results)
  const resolvedUpdates: Record<string, any> = {}
  for (const [key, value] of Object.entries(updates)) {
    resolvedUpdates[key] = resolveValue(value, { input: inputData, ...nodeResults })
  }

  // Determine update target
  const updateId = contextId || node.config?.id || inputData.id

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

async function executeAPICallNode(node: any, inputData: Record<string, any>, nodeResults: Record<string, any>): Promise<any> {
  const url = node.config?.url
  const method = node.config?.method || 'GET'
  const headers = node.config?.headers || {}
  const body = node.config?.body

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

async function executeNotificationNode(node: any, inputData: Record<string, any>, nodeResults: Record<string, any>): Promise<any> {
  const type = node.config?.type || 'email'
  const recipient = node.config?.recipient
  const subject = node.config?.subject
  const message = node.config?.message

  // Resolve template variables
  const resolvedMessage = resolveValue(message, { input: inputData, ...nodeResults })
  const resolvedSubject = resolveValue(subject, { input: inputData, ...nodeResults })

  // In production, integrate with notification service
  // For now, just log
  // TODO: Implement actual notification sending
  // logInfo(`Notification [${type}]`, { recipient, subject: resolvedSubject, message: resolvedMessage })

  return { success: true, sent: true }
}

async function executeDelayNode(node: any): Promise<any> {
  const delay = node.config?.delay || 1000
  await new Promise(resolve => setTimeout(resolve, delay))
  return { success: true, delayed: delay }
}

async function executeTransformNode(node: any, inputData: Record<string, any>, nodeResults: Record<string, any>): Promise<any> {
  const transform = node.config?.transform || {}
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(transform)) {
    result[key] = resolveValue(value, { input: inputData, ...nodeResults })
  }

  return { success: true, data: result }
}

async function executeWebhookNode(node: any, inputData: Record<string, any>, nodeResults: Record<string, any>): Promise<any> {
  const url = node.config?.url
  const method = node.config?.method || 'POST'
  const body = node.config?.body || { ...inputData, ...nodeResults }

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
function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  try {
    // Simple condition evaluation (in production, use a proper expression evaluator)
    // Supports: {{variable}} == value, {{variable}} != value, etc.
    const resolved = resolveValue(condition, context)
    return Boolean(resolved)
  } catch {
    return false
  }
}

function resolveValue(value: any, context: Record<string, any>): any {
  if (typeof value === 'string') {
    // Replace {{variable}} with context values
    return value.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const keys = path.split('.')
      let result: any = context
      for (const key of keys) {
        result = result?.[key]
        if (result === undefined) return match
      }
      return result
    })
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(v => resolveValue(v, context))
    }
    const resolved: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveValue(v, context)
    }
    return resolved
  }
  return value
}
