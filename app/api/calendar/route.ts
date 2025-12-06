/**
 * Google Calendar API Route
 * Handles appointment scheduling with Google Calendar integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createEvent, updateEvent, deleteEvent, getEvents } from '@/lib/calendar'
import { supabaseAdmin } from '@/lib'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, patientName, phone, specialist, date, duration, appointmentId, eventId } = body

    if (action === 'create') {
      if (!patientName || !phone || !specialist || !date) {
        return NextResponse.json(
          { error: 'Patient name, phone, specialist, and date are required' },
          { status: 400 }
        )
      }

      // Create calendar event
      const calendarEventId = await createEvent(patientName, date, specialist, duration || 60)

      // Save appointment to database
      const { data: appointment, error: dbError } = await supabaseAdmin
        .from('appointments')
        .insert({
          patient_name: patientName,
          phone,
          specialist,
          date,
          status: 'confirmed',
          calendar_event_id: calendarEventId,
        })
        .select()
        .single()

      if (dbError) {
        // Rollback: delete calendar event if DB insert fails
        await deleteEvent(calendarEventId).catch(console.error)
        throw dbError
      }

      return NextResponse.json({
        success: true,
        appointment,
        calendarEventId,
      })
    }

    if (action === 'update' && eventId && appointmentId) {
      await updateEvent(eventId, {
        summary: `موعد: ${patientName} مع ${specialist}`,
        description: `موعد طبي محجوز عبر نظام مركز الهمم\nالمريض: ${patientName}\nالأخصائي: ${specialist}`,
        start: { dateTime: date },
        end: { dateTime: new Date(new Date(date).getTime() + (duration || 60) * 60000).toISOString() },
      })

      await supabaseAdmin
        .from('appointments')
        .update({ date, specialist, updated_at: new Date().toISOString() })
        .eq('id', appointmentId)

      return NextResponse.json({ success: true })
    }

    if (action === 'delete' && eventId && appointmentId) {
      await deleteEvent(eventId)
      await supabaseAdmin.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Calendar API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process calendar request',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || new Date().toISOString()
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const events = await getEvents(startDate, endDate)

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error: any) {
    console.error('Calendar GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch calendar events',
      },
      { status: 500 }
    )
  }
}
