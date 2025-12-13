/**
 * WhatsApp Settings Repository
 * Manages WhatsApp integration settings with proper error handling and logging
 * Extends BaseRepository for common CRUD operations
 */

import { BaseRepository } from '@/core/repositories/base.repository'
import { supabaseAdmin } from '@/lib'
import { logError, logInfo } from '@/shared/utils/logger'

export interface WhatsAppSettings extends Record<string, unknown> {
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

export class WhatsAppSettingsRepository extends BaseRepository<WhatsAppSettings> {
  protected readonly tableName = 'whatsapp_settings'
  protected readonly selectFields = '*'

  /**
   * Map database row to entity
   */
  protected mapToEntity(row: unknown): WhatsAppSettings {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      name: data.name as string | undefined,
      verify_token: data.verify_token as string,
      access_token: data.access_token as string,
      phone_number_id: data.phone_number_id as string,
      webhook_url: data.webhook_url as string | null,
      app_id: data.app_id as string | null | undefined,
      waba_id: data.waba_id as string | null | undefined,
      phone_number: data.phone_number as string | null | undefined,
      is_active: data.is_active as boolean,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    }
  }
  /**
   * Get active WhatsApp settings
   */
  async getActiveSettings(): Promise<WhatsAppSettings | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(this.selectFields)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return this.mapToEntity(data)
    } catch (error) {
      logError('Error fetching active WhatsApp settings', error)
      return null
    }
  }

  /**
   * Get all settings (for admin) - uses BaseRepository getAll
   */
  async getAllSettings(): Promise<WhatsAppSettings[]> {
    return this.getAll({
      orderBy: { column: 'created_at', ascending: false },
    })
  }

  /**
   * Update settings - uses BaseRepository update
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
      
      return await this.update(id, updateData)
    } catch (error) {
      logError('Error updating WhatsApp settings', error, { id })
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
          .from(this.tableName)
          .update({ is_active: false })
          .eq('is_active', true)
      }

      const insertData = {
        ...settings,
        updated_at: new Date().toISOString(),
      }

      return await this.create(insertData)
    } catch (error) {
      logError('Error creating WhatsApp settings', error)
      return null
    }
  }
}

export const whatsappSettingsRepository = new WhatsAppSettingsRepository()


