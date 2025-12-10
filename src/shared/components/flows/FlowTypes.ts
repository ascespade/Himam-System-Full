/**
 * Unified Flow Types
 * Centralized type definitions for all flow systems
 */

export type FlowModule = 'whatsapp' | 'insurance' | 'appointments' | 'billing' | 'general'

export type FlowTriggerType = 
  | 'keyword' 
  | 'intent' 
  | 'message_pattern' 
  | 'event'
  | 'condition'
  | 'webhook'
  | 'api_call'
  | 'database_change'
  | 'user_action'
  | 'ai_detection'
  | 'manual'
  | 'schedule'

export type FlowCategory = 
  | 'appointment' 
  | 'information' 
  | 'support' 
  | 'booking' 
  | 'insurance'
  | 'billing'
  | 'notification'
  | 'automation'
  | 'custom'

export interface FlowTriggerConfig {
  keywords?: string[]
  intents?: string[]
  patterns?: string[]
  events?: string[]
  condition?: string
  schedule?: {
    cron?: string
    timezone?: string
  }
}

export interface FlowStep {
  step: number
  name: string
  type: 'ai_response' | 'database_action' | 'api_call' | 'notification' | 'condition' | 'delay'
  description: string
  config?: Record<string, unknown>
}

export interface BaseFlow {
  id: string
  name: string
  description?: string
  module: FlowModule
  category: FlowCategory
  trigger_type: FlowTriggerType
  trigger_config: FlowTriggerConfig
  steps: FlowStep[]
  is_active: boolean
  priority: number
  created_at: string
  updated_at?: string
  created_by?: string
}

export interface WhatsAppFlow extends BaseFlow {
  module: 'whatsapp'
  appointment_actions?: string[]
  ai_model: string
  system_prompt?: string
  response_template?: string
  version: number
}

export interface InsuranceFlow extends BaseFlow {
  module: 'insurance'
  insurance_company?: string
  auto_retry?: boolean
  learning_enabled?: boolean
}

export interface GeneralFlow extends BaseFlow {
  module: 'general' | 'appointments' | 'billing'
  ai_model?: string
}

export type Flow = WhatsAppFlow | InsuranceFlow | GeneralFlow

export interface FlowExecution {
  id: string
  flow_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  context_type: string
  context_id?: string
  input_data?: Record<string, unknown>
  output_data?: Record<string, unknown>
  error?: string
  started_at: string
  completed_at?: string
}

