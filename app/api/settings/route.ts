/**
 * Settings API Route
 * Manages system settings from Supabase settings table
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/lib/config'
import { supabaseAdmin } from '@/lib'
import { successResponse, errorResponse, parseRequestBody } from '@/shared/utils/api'
import { HTTP_STATUS, SUCCESS_MESSAGES } from '@/shared/constants'
import type { SystemSetting } from '@/shared/types'

import { whatsappSettingsRepository } from '@/infrastructure/supabase/repositories/whatsapp-settings.repository'

export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('key, value, description, updated_at')
      .order('key')

    if (error) throw error

    // Fetch active WhatsApp settings to show the source of truth
    const waConfig = await whatsappSettingsRepository.getActiveSettings()

    if (waConfig && settings) {
      settings.forEach((setting) => {
        if (setting.key === 'WHATSAPP_TOKEN' && waConfig.access_token) setting.value = waConfig.access_token
        if (setting.key === 'WHATSAPP_PHONE_NUMBER_ID' && waConfig.phone_number_id) setting.value = waConfig.phone_number_id
        if (setting.key === 'WHATSAPP_VERIFY_TOKEN' && waConfig.verify_token) setting.value = waConfig.verify_token
      })
    }

    return NextResponse.json(
      successResponse(settings || [])
    )
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      errorResponse(error),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody<Record<string, string>>(req)

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        errorResponse('Settings object is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // 1. Update General Settings Table
    const success = await updateSettings(body)

    if (!success) {
      return NextResponse.json(
        errorResponse('Failed to update settings'),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // 2. Sync to Whatsapp Settings Table if needed
    const waKeys = ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN']
    const hasWaUpdates = Object.keys(body).some(k => waKeys.includes(k))

    if (hasWaUpdates) {
      const activeSettings = await whatsappSettingsRepository.getActiveSettings()
      
      const updates: any = {}
      if (body['WHATSAPP_TOKEN']) updates.access_token = body['WHATSAPP_TOKEN']
      if (body['WHATSAPP_PHONE_NUMBER_ID']) updates.phone_number_id = body['WHATSAPP_PHONE_NUMBER_ID']
      if (body['WHATSAPP_VERIFY_TOKEN']) updates.verify_token = body['WHATSAPP_VERIFY_TOKEN']

      if (Object.keys(updates).length > 0) {
        if (activeSettings) {
          await whatsappSettingsRepository.updateSettings(activeSettings.id, updates)
        } else {
          // Create new active settings if none exist
          await whatsappSettingsRepository.createSettings({
            access_token: updates.access_token || '',
            phone_number_id: updates.phone_number_id || '',
            verify_token: updates.verify_token || '',
            webhook_url: null, // Will be set by user manually if needed or we can infer
            is_active: true
          })
        }
      }
    }

    return NextResponse.json(
      successResponse(null, SUCCESS_MESSAGES.UPDATED)
    )
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      errorResponse(error),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}



