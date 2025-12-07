import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/doctor/appointments
 * Get today's appointments for the logged-in doctor
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Get doctor_id from auth session
    // For now, we'll get all appointments and filter by date
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .gte('date', `${today}T00:00:00`)
      .lt('date', `${today}T23:59:59`)
      .eq('status', 'confirmed')
      .order('date', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

