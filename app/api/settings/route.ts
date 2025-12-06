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

export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('key, value, description, updated_at')
      .order('key')

    if (error) throw error

    return NextResponse.json(
      successResponse<SystemSetting[]>(settings || [])
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

    const success = await updateSettings(body)

    if (!success) {
      return NextResponse.json(
        errorResponse('Failed to update settings'),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
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



