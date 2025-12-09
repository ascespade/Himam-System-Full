/**
 * Appointment Repository
 * Placeholder implementation - to be implemented when needed
 */

import { supabaseAdmin } from '@/lib'

export class AppointmentRepository {
  private readonly table = 'appointments'

  async findById(id: string): Promise<unknown | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch appointment: ${error.message}`)
    }

    return data
  }
}

export const appointmentRepository = new AppointmentRepository()
