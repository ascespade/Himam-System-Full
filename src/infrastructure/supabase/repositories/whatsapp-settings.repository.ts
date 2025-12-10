import { supabaseAdmin } from '@/lib'

export interface WhatsAppSettings {
  id: string
  name?: string
  verify_token: string
  access_token: string
  phone_number_id: string
  webhook_url: string | null
  app_id?: string | null
  waba_id?: string | null
  phone_number?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export class WhatsAppSettingsRepository {
  /**
   * Get active WhatsApp settings
   */
  async getActiveSettings(): Promise<WhatsAppSettings | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_settings')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw error
      }

      return data as WhatsAppSettings
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error)
      return null
    }
  }

  /**
   * Get all settings (for admin)
   */
  async getAllSettings(): Promise<WhatsAppSettings[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_settings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as WhatsAppSettings[]
    } catch (error) {
      console.error('Error fetching all WhatsApp settings:', error)
      return []
    }
  }

  /**
   * Update settings
   */
  async updateSettings(
    id: string,
    updates: Partial<Omit<WhatsAppSettings, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<WhatsAppSettings | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }
      
      const { data, error } = await supabaseAdmin
        .from('whatsapp_settings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as WhatsAppSettings
    } catch (error) {
      console.error('Error updating WhatsApp settings:', error)
      return null
    }
  }

  /**
   * Create new settings
   */
  async createSettings(
    settings: Omit<WhatsAppSettings, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WhatsAppSettings | null> {
    try {
      // Deactivate all existing settings if this one should be active
      if (settings.is_active) {
        await supabaseAdmin
          .from('whatsapp_settings')
          .update({ is_active: false })
          .eq('is_active', true)
      }

      const insertData = {
        ...settings,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin
        .from('whatsapp_settings')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      return data as WhatsAppSettings
    } catch (error) {
      console.error('Error creating WhatsApp settings:', error)
      return null
    }
  }
}

export const whatsappSettingsRepository = new WhatsAppSettingsRepository()


