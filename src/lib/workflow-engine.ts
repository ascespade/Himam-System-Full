/**
 * Workflow Engine
 * محرك التدفقات الذكي - ينفذ التدفقات بناءً على الأحداث
 */

import { supabaseAdmin } from './supabase'

export interface WorkflowStep {
  type: string // 'ai_response', 'send_notification', 'create_record', 'update_status', etc.
  config: any
  condition?: string // Optional condition to execute this step
}

export interface WorkflowExecution {
  workflowId: string
  entityType: string
  entityId: string
  context?: any
}

/**
 * Execute workflow
 */
export async function executeWorkflow(execution: WorkflowExecution) {
  try {
    // Get workflow definition
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflow_definitions')
      .select('*')
      .eq('id', execution.workflowId)
      .eq('is_active', true)
      .single()

    if (workflowError || !workflow) {
      throw new Error('Workflow not found or inactive')
    }

    // Create execution record
    const { data: execRecord, error: execError } = await supabaseAdmin
      .from('workflow_executions')
      .insert({
        workflow_id: execution.workflowId,
        entity_type: execution.entityType,
        entity_id: execution.entityId,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (execError) throw execError

    const steps = workflow.steps as WorkflowStep[]
    const stepResults: any[] = []

    // Execute each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      try {
        // Check condition if exists
        if (step.condition && !evaluateCondition(step.condition, execution.context)) {
          stepResults.push({ step: i, skipped: true, reason: 'Condition not met' })
          continue
        }

        // Execute step
        const result = await executeStep(step, execution, workflow.ai_model)
        stepResults.push({ step: i, result })

        // Update execution progress
        await supabaseAdmin
          .from('workflow_executions')
          .update({
            current_step: i + 1,
            step_results: stepResults
          })
          .eq('id', execRecord.id)

      } catch (stepError: any) {
        stepResults.push({ step: i, error: stepError.message })
        
        // Mark execution as failed
        await supabaseAdmin
          .from('workflow_executions')
          .update({
            status: 'failed',
            error_message: stepError.message,
            step_results: stepResults
          })
          .eq('id', execRecord.id)

        throw stepError
      }
    }

    // Mark as completed
    await supabaseAdmin
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        step_results: stepResults
      })
      .eq('id', execRecord.id)

    return { success: true, executionId: execRecord.id, results: stepResults }
  } catch (error: any) {
    console.error('Workflow execution error:', error)
    throw error
  }
}

/**
 * Execute a single workflow step
 */
async function executeStep(
  step: WorkflowStep,
  execution: WorkflowExecution,
  aiModel: string
): Promise<any> {
  switch (step.type) {
    case 'ai_response':
      return await executeAIStep(step, execution, aiModel)
    
    case 'send_notification':
      return await executeNotificationStep(step, execution)
    
    case 'create_record':
      return await executeCreateRecordStep(step, execution)
    
    case 'update_status':
      return await executeUpdateStatusStep(step, execution)
    
    case 'send_whatsapp':
      return await executeWhatsAppStep(step, execution)
    
    case 'trigger_workflow':
      return await executeTriggerWorkflowStep(step, execution)
    
    default:
      throw new Error(`Unknown step type: ${step.type}`)
  }
}

async function executeAIStep(
  step: WorkflowStep,
  execution: WorkflowExecution,
  aiModel: string
): Promise<any> {
  const { askAI } = await import('./ai')
  
  const prompt = step.config.prompt || ''
  const context = execution.context || {}

  // Replace placeholders in prompt
  const finalPrompt = replacePlaceholders(prompt, {
    ...context,
    entity_type: execution.entityType,
    entity_id: execution.entityId
  })

  const response = await askAI(finalPrompt, JSON.stringify(context))
  return { response: response.text }
}

async function executeNotificationStep(
  step: WorkflowStep,
  execution: WorkflowExecution
): Promise<any> {
  const { createNotification, NotificationTemplates } = await import('./notifications')
  
  const { userId, title, message } = step.config

  await createNotification({
    userId: userId || execution.context?.userId,
    title: title || 'إشعار',
    message: message || 'لديك إشعار جديد',
    type: 'system',
    entityType: execution.entityType,
    entityId: execution.entityId
  })

  return { sent: true }
}

async function executeCreateRecordStep(
  step: WorkflowStep,
  execution: WorkflowExecution
): Promise<any> {
  const { table, data } = step.config

  const recordData = replacePlaceholders(data, {
    ...execution.context,
    entity_type: execution.entityType,
    entity_id: execution.entityId
  })

  const { data: record, error } = await supabaseAdmin
    .from(table)
    .insert(recordData)
    .select()
    .single()

  if (error) throw error

  return { record_id: record.id }
}

async function executeUpdateStatusStep(
  step: WorkflowStep,
  execution: WorkflowExecution
): Promise<any> {
  const { table, status_field, status_value } = step.config

  const { error } = await supabaseAdmin
    .from(table)
    .update({ [status_field]: status_value })
    .eq('id', execution.entityId)

  if (error) throw error

  return { updated: true }
}

async function executeWhatsAppStep(
  step: WorkflowStep,
  execution: WorkflowExecution
): Promise<any> {
  const { sendTextMessage } = await import('./whatsapp')
  
  const { phone, message } = step.config

  const finalMessage = replacePlaceholders(message, {
    ...execution.context,
    entity_type: execution.entityType,
    entity_id: execution.entityId
  })

  await sendTextMessage(phone, finalMessage)
  return { sent: true }
}

async function executeTriggerWorkflowStep(
  step: WorkflowStep,
  execution: WorkflowExecution
): Promise<any> {
  const { workflow_id } = step.config

  // Recursively execute another workflow
  return await executeWorkflow({
    workflowId: workflow_id,
    entityType: execution.entityType,
    entityId: execution.entityId,
    context: execution.context
  })
}

/**
 * Evaluate condition
 */
function evaluateCondition(condition: string, context: any): boolean {
  // Simple condition evaluation
  // Can be enhanced with a proper expression parser
  try {
    // Replace variables in condition
    const evaluated = replacePlaceholders(condition, context)
    // Simple evaluation (can be enhanced)
    return eval(evaluated) // In production, use a safe expression evaluator
  } catch {
    return false
  }
}

/**
 * Replace placeholders in string
 */
function replacePlaceholders(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}

/**
 * Trigger workflow by event
 */
export async function triggerWorkflowByEvent(
  eventType: string,
  entityType: string,
  entityId: string,
  context?: any
) {
  try {
    // Find workflows triggered by this event
    const { data: workflows, error } = await supabaseAdmin
      .from('workflow_definitions')
      .select('*')
      .eq('trigger_type', 'event')
      .eq('is_active', true)
      .contains('trigger_config', { event_type: eventType })

    if (error) throw error

    // Execute all matching workflows
    const results = await Promise.allSettled(
      (workflows || []).map(workflow =>
        executeWorkflow({
          workflowId: workflow.id,
          entityType,
          entityId,
          context
        })
      )
    )

    return results
  } catch (error: any) {
    console.error('Error triggering workflow by event:', error)
    throw error
  }
}

