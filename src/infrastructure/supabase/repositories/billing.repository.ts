/**
 * Billing Repository
 * Placeholder implementation - to be implemented when needed
 */

import { supabaseAdmin } from '@/lib'

export class BillingRepository {
  private readonly table = 'billing'

  async findById(id: string): Promise<unknown | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch billing record: ${error.message}`)
    }

    return data
  }
}

export const billingRepository = new BillingRepository()
