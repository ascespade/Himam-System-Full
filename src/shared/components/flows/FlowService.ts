/**
 * Unified Flow Service
 * Centralized service for managing flows across all modules
 */

import { supabaseAdmin } from '@/lib/supabase'
import type { Flow, FlowModule, BaseFlow, FlowExecution } from './FlowTypes'

export class FlowService {
  /**
   * Get flows by module
   */
  static async getFlowsByModule(module: FlowModule, filters?: {
    category?: string
    isActive?: boolean
  }): Promise<Flow[]> {
    try {
      let query = supabaseAdmin
        .from(this.getTableName(module))
        .select('*')
        .eq('module', module)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []) as Flow[]
    } catch (error) {
      console.error(`Error fetching ${module} flows:`, error)
      return []
    }
  }

  /**
   * Get single flow by ID
   */
  static async getFlowById(module: FlowModule, flowId: string): Promise<Flow | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.getTableName(module))
        .select('*')
        .eq('id', flowId)
        .eq('module', module)
        .single()

      if (error) throw error

      return data as Flow
    } catch (error) {
      console.error(`Error fetching flow ${flowId}:`, error)
      return null
    }
  }

  /**
   * Create new flow
   */
  static async createFlow(module: FlowModule, flow: Partial<BaseFlow>): Promise<Flow | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.getTableName(module))
        .insert({
          ...flow,
          module,
        })
        .select()
        .single()

      if (error) throw error

      return data as Flow
    } catch (error) {
      console.error(`Error creating ${module} flow:`, error)
      return null
    }
  }

  /**
   * Update flow
   */
  static async updateFlow(
    module: FlowModule,
    flowId: string,
    updates: Partial<BaseFlow>
  ): Promise<Flow | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.getTableName(module))
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', flowId)
        .eq('module', module)
        .select()
        .single()

      if (error) throw error

      return data as Flow
    } catch (error) {
      console.error(`Error updating flow ${flowId}:`, error)
      return null
    }
  }

  /**
   * Delete flow
   */
  static async deleteFlow(module: FlowModule, flowId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from(this.getTableName(module))
        .delete()
        .eq('id', flowId)
        .eq('module', module)

      if (error) throw error

      return true
    } catch (error) {
      console.error(`Error deleting flow ${flowId}:`, error)
      return false
    }
  }

  /**
   * Toggle flow active status
   */
  static async toggleFlow(module: FlowModule, flowId: string): Promise<Flow | null> {
    try {
      // Get current status
      const flow = await this.getFlowById(module, flowId)
      if (!flow) return null

      return await this.updateFlow(module, flowId, {
        is_active: !flow.is_active,
      })
    } catch (error) {
      console.error(`Error toggling flow ${flowId}:`, error)
      return null
    }
  }

  /**
   * Get flow executions
   */
  static async getFlowExecutions(flowId: string, limit = 50): Promise<FlowExecution[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('flow_executions')
        .select('*')
        .eq('flow_id', flowId)
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []) as FlowExecution[]
    } catch (error) {
      console.error(`Error fetching executions for flow ${flowId}:`, error)
      return []
    }
  }

  /**
   * Get table name based on module
   */
  private static getTableName(module: FlowModule): string {
    const tableMap: Record<FlowModule, string> = {
      whatsapp: 'whatsapp_flows',
      insurance: 'flows',
      appointments: 'flows',
      billing: 'flows',
      general: 'workflow_definitions',
    }

    return tableMap[module] || 'flows'
  }
}

