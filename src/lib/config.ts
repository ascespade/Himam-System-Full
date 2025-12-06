/**
 * Configuration loader from Supabase settings table
 * Centralized config management for the entire system
 */

import { supabase } from './supabase'

export interface SystemSettings {
  GEMINI_KEY: string
  OPENAI_KEY: string
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

/**
 * Get all settings from Supabase
 * @returns Record of key-value pairs
 */
export async function getSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')

    if (error) {
      console.error('Error fetching settings:', error)
      return {} as SystemSettings
    }

    const settings: Record<string, string> = {}
    data?.forEach((row) => {
      settings[row.key] = row.value
    })

    return settings as SystemSettings
  } catch (error) {
    console.error('Error in getSettings:', error)
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
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) {
      return defaultValue
    }

    return data.value || defaultValue
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error)
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
    const { error } = await supabase
      .from('settings')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error(`Error updating setting ${key}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error in updateSetting for ${key}:`, error)
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

    const { error } = await supabase.from('settings').upsert(updates)

    if (error) {
      console.error('Error updating settings:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateSettings:', error)
    return false
  }
}



