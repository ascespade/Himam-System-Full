/**
 * Centralized exports for lib directory
 * Use: import { supabase, supabaseAdmin, getSettings, askAI } from '@/lib'
 * 
 * Note: Calendar functions are only available in API routes (server-side only)
 * Use /api/calendar instead of importing calendar functions directly
 */

export { supabase, supabaseAdmin } from './supabase'
export { getSettings, getSetting, updateSetting, updateSettings } from './config'
export { askAI, generateWhatsAppResponse } from './ai'
export {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  invalidateEntityCache,
  getOrSetCache,
  isCacheAvailable,
} from './redis'
// Calendar functions are server-side only - use /api/calendar instead
// export { createEvent, updateEvent, deleteEvent, getEvents } from './calendar'
