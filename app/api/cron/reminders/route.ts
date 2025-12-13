/**
 * Cron Job: Send Appointment Reminders
 * Runs daily to send reminders for tomorrow's appointments via WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib'
import { sendTextMessage } from '@/lib/whatsapp-messaging'
import { formatAppointmentTime } from '@/lib/booking-parser'

// Verify cron secret to prevent unauthorized access
function verifyCron(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

export async function GET(req: NextRequest) {
  // Check for specialized Vercel Cron header or custom secret
  // Vercel automatically adds 'Authorization' header if CRON_SECRET is set in project settings
  if (process.env.NODE_ENV === 'production' && !verifyCron(req)) {
    // Allows manual testing in development without secret
    // return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 1. Calculate date range for "tomorrow"
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    // Set to start of day
    tomorrow.setHours(0, 0, 0, 0)
    
    // Set to end of day
    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1)

    // Checking appointments for tomorrow

    // 2. Fetch confirmed appointments for tomorrow
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('status', 'confirmed') // Only remind confirmed appointments
      .gte('date', tomorrow.toISOString())
      .lt('date', dayAfterTomorrow.toISOString())

    if (error) {
      throw error
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ success: true, message: 'No appointments found for tomorrow.' })
    }

    // Found appointments to remind

    // 3. Send reminders
    const results = await Promise.allSettled(
      appointments.map(async (apt) => {
        const time = formatAppointmentTime(new Date(apt.date).toTimeString().substring(0, 5))
        const message = `تذكير: لديك موعد غداً 📅\n\n` +
          `مع: ${apt.specialist}\n` +
          `الساعة: ${time}\n\n` +
          `نرجو الحضور قبل الموعد بـ 15 دقيقة. في حال الرغبة في الإلغاء، يرجى التواصل معنا.`
        
        await sendTextMessage(apt.phone, message)
        return apt.id
      })
    )

    // 4. Summarize results
    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      processed: appointments.length,
      successful,
      failed,
      date: tomorrow.toISOString().split('T')[0]
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    const { logError } = await import('@/shared/utils/logger')
    logError('Error', error, { endpoint: '/api/cron/reminders' })

    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
