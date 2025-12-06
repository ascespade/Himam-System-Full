import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const GOOGLE_CALENDAR_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID
const GOOGLE_CALENDAR_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
const GOOGLE_CALENDAR_REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { patientId, specialistId, date, time, duration = 60, notes = '' } = body

    if (!patientId || !specialistId || !date || !time) {
      return NextResponse.json(
        { error: 'Patient ID, specialist ID, date, and time are required' },
        { status: 400 }
      )
    }

    if (!GOOGLE_CALENDAR_CLIENT_ID || !GOOGLE_CALENDAR_CLIENT_SECRET || !GOOGLE_CALENDAR_REFRESH_TOKEN) {
      return NextResponse.json(
        { error: 'Google Calendar API not configured' },
        { status: 500 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CALENDAR_CLIENT_ID,
      GOOGLE_CALENDAR_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_CALENDAR_REFRESH_TOKEN,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Parse date and time
    const startDateTime = new Date(`${date}T${time}`)
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000)

    const event = {
      summary: 'موعد طبي - مركز الهمم',
      description: notes || 'موعد طبي في مركز الهمم - جدة',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Riyadh',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Riyadh',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    })

    return NextResponse.json({
      source: 'GoogleCalendar',
      eventId: response.data.id,
      meetLink: response.data.hangoutLink,
      ok: true,
    })
  } catch (error: any) {
    console.error('Calendar API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}
