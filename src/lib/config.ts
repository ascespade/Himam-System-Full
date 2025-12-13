/**
 * Configuration loader from Supabase settings table
 * Centralized config management for the entire system
 */

import { supabase, supabaseAdmin } from './supabase'

export interface SystemSettings {
  GEMINI_KEY: string
  OPENAI_KEY: string
  AI_MODEL: 'gemini' | 'openai' | 'auto' // AI model selection: gemini, openai, or auto (try both)
  WHATSAPP_TOKEN: string
  WHATSAPP_PHONE_NUMBER_ID: string
  WHATSAPP_VERIFY_TOKEN: string
  GOOGLE_CLIENT_EMAIL: string
  GOOGLE_PRIVATE_KEY: string
  GOOGLE_CALENDAR_ID: string
  CRM_URL: string
  CRM_TOKEN: string
  [key: string]: string
}

import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories/whatsapp-settings.repository'

/**
 * Get all settings from Supabase
 * Merges general settings with specialized whatsapp_settings
 * @returns Record of key-value pairs
 */
export async function getSettings(): Promise<SystemSettings> {
  try {
// 1. Fetch General Settings
    const { data: generalData, error } = await supabaseAdmin // Use Admin client to bypass RLS
      .from('settings')
      .select('key, value')

    if (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching settings', error)
      return {} as SystemSettings
    }

    const settings: Record<string, string> = {}
    generalData?.forEach((row) => {
      settings[row.key] = row.value
    })

    // 2. Fetch Specialized WhatsApp Settings
    const whatsappConfig = await whatsappSettingsRepository.getActiveSettings()
    
    if (whatsappConfig) {
      // Overlay specialized settings
      if (whatsappConfig.access_token) settings['WHATSAPP_TOKEN'] = whatsappConfig.access_token
      if (whatsappConfig.phone_number_id) settings['WHATSAPP_PHONE_NUMBER_ID'] = whatsappConfig.phone_number_id
      if (whatsappConfig.verify_token) settings['WHATSAPP_VERIFY_TOKEN'] = whatsappConfig.verify_token
    }

    return settings as SystemSettings
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error in getSettings', error)
    return {} as SystemSettings
  }
}

/**
 * Get a single setting value by key
 * @param key - Setting key
 * @param defaultValue - Default value if not found
 * @returns Setting value or default
 */
export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    // Check specialized tables for specific keys
    if (['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN'].includes(key)) {
      const waConfig = await whatsappSettingsRepository.getActiveSettings()
      if (waConfig) {
        if (key === 'WHATSAPP_TOKEN') return waConfig.access_token || defaultValue
        if (key === 'WHATSAPP_PHONE_NUMBER_ID') return waConfig.phone_number_id || defaultValue
        if (key === 'WHATSAPP_VERIFY_TOKEN') return waConfig.verify_token || defaultValue
      }
    }

    const { data, error } = await supabaseAdmin // Use Admin client
      .from('settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) {
      return defaultValue
    }

    return data.value || defaultValue
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError(`Error fetching setting ${key}`, error)
    return defaultValue
  }
}

/**
 * Update a setting value
 * @param key - Setting key
 * @param value - New value
 * @param description - Optional description
 */
export async function updateSetting(
  key: string,
  value: string,
  description?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError(`Error updating setting ${key}`, error)
      return false
    }

    return true
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError(`Error in updateSetting for ${key}`, error)
    return false
  }
}

/**
 * Update multiple settings at once
 * @param settings - Record of key-value pairs
 */
export async function updateSettings(settings: Record<string, string>): Promise<boolean> {
  try {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabaseAdmin.from('settings').upsert(updates)

    if (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error updating settings', error)
      return false
    }

    return true
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error in updateSettings', error)
    return false
  }
}



