/**
 * Settings API Route
 * Manages system settings from Supabase settings table
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/lib/config'
import { supabaseAdmin } from '@/lib'

export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('key, value, description')
      .order('key')

    if (error) throw error

    return NextResponse.json({
      success: true,
      settings: settings || [],
    })
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch settings',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const settings = body as Record<string, string>

    const success = await updateSettings(settings)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update settings',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update settings',
      },
      { status: 500 }
    )
  }
}



