/**
 * Google Calendar Integration
 * Handles appointment scheduling and calendar management
 */

import { google } from 'googleapis'
import { getSettings } from './config'

export interface CalendarEvent {
  summary: string
  description?: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
  attendees?: Array<{ email: string }>
}

/**
 * Create a calendar event
 * @param patient - Patient name
 * @param date - Appointment date/time (ISO string)
 * @param specialist - Specialist name
 * @param duration - Duration in minutes (default: 60)
 * @returns Calendar event ID
 */
export async function createEvent(
  patient: string,
  date: string,
  specialist: string,
  duration: number = 60
): Promise<string> {
  const settings = await getSettings()

  if (!settings.GOOGLE_CLIENT_EMAIL || !settings.GOOGLE_PRIVATE_KEY || !settings.GOOGLE_CALENDAR_ID) {
    throw new Error('Google Calendar credentials not configured')
  }

  try {
    const auth = new google.auth.JWT(
      settings.GOOGLE_CLIENT_EMAIL,
      undefined,
      settings.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar']
    )

    const calendar = google.calendar({ version: 'v3', auth })

    const startDate = new Date(date)
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000)

    const event: CalendarEvent = {
      summary: `موعد: ${patient} مع ${specialist}`,
      description: `موعد طبي محجوز عبر نظام مركز الهمم\nالمريض: ${patient}\nالأخصائي: ${specialist}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Riyadh',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Riyadh',
      },
    }

    const response = await calendar.events.insert({
      calendarId: settings.GOOGLE_CALENDAR_ID,
      requestBody: event,
    })

    if (!response.data.id) {
      throw new Error('Failed to create calendar event')
    }

    return response.data.id
  } catch (error: any) {
    console.error('Error creating calendar event:', error)
    throw new Error(`Failed to create calendar event: ${error.message}`)
  }
}

/**
 * Update a calendar event
 * @param eventId - Calendar event ID
 * @param updates - Partial event updates
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<void> {
  const settings = await getSettings()

  if (!settings.GOOGLE_CLIENT_EMAIL || !settings.GOOGLE_PRIVATE_KEY || !settings.GOOGLE_CALENDAR_ID) {
    throw new Error('Google Calendar credentials not configured')
  }

  try {
    const auth = new google.auth.JWT(
      settings.GOOGLE_CLIENT_EMAIL,
      undefined,
      settings.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar']
    )

    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.patch({
      calendarId: settings.GOOGLE_CALENDAR_ID,
      eventId,
      requestBody: updates,
    })
  } catch (error: any) {
    console.error('Error updating calendar event:', error)
    throw new Error(`Failed to update calendar event: ${error.message}`)
  }
}

/**
 * Delete a calendar event
 * @param eventId - Calendar event ID
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const settings = await getSettings()

  if (!settings.GOOGLE_CLIENT_EMAIL || !settings.GOOGLE_PRIVATE_KEY || !settings.GOOGLE_CALENDAR_ID) {
    throw new Error('Google Calendar credentials not configured')
  }

  try {
    const auth = new google.auth.JWT(
      settings.GOOGLE_CLIENT_EMAIL,
      undefined,
      settings.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar']
    )

    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({
      calendarId: settings.GOOGLE_CALENDAR_ID,
      eventId,
    })
  } catch (error: any) {
    console.error('Error deleting calendar event:', error)
    throw new Error(`Failed to delete calendar event: ${error.message}`)
  }
}

/**
 * Get calendar events for a date range
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Array of calendar events
 */
export async function getEvents(startDate: string, endDate: string): Promise<any[]> {
  const settings = await getSettings()

  if (!settings.GOOGLE_CLIENT_EMAIL || !settings.GOOGLE_PRIVATE_KEY || !settings.GOOGLE_CALENDAR_ID) {
    throw new Error('Google Calendar credentials not configured')
  }

  try {
    const auth = new google.auth.JWT(
      settings.GOOGLE_CLIENT_EMAIL,
      undefined,
      settings.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar']
    )

    const calendar = google.calendar({ version: 'v3', auth })

    const response = await calendar.events.list({
      calendarId: settings.GOOGLE_CALENDAR_ID,
      timeMin: startDate,
      timeMax: endDate,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return response.data.items || []
  } catch (error: any) {
    console.error('Error fetching calendar events:', error)
    throw new Error(`Failed to fetch calendar events: ${error.message}`)
  }
}



