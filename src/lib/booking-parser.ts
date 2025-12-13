/**
 * Booking Intent Parser
 * Uses AI to extract appointment details from user messages
 */

export interface BookingDetails {
  patientName?: string
  phone?: string
  specialist?: string
  service?: string
  date?: string
  time?: string
  isComplete: boolean
  missingFields: string[]
}

/**
 * Parse booking intent from AI response
 * Looks for [BOOKING_READY] marker followed by JSON
 */
export function parseBookingFromAI(aiResponse: string): BookingDetails | null {
  const bookingMarker = '[BOOKING_READY]'
  
  if (!aiResponse.includes(bookingMarker)) {
    return null
  }

  try {
    // Extract JSON after marker
    const jsonStart = aiResponse.indexOf('{', aiResponse.indexOf(bookingMarker))
    const jsonEnd = aiResponse.lastIndexOf('}') + 1
    
    if (jsonStart === -1 || jsonEnd === 0) {
      return null
    }

    const jsonStr = aiResponse.substring(jsonStart, jsonEnd)
    const data = JSON.parse(jsonStr)

    const details: BookingDetails = {
      patientName: data.patient_name || data.name,
      phone: data.phone || data.mobile,
      specialist: data.specialist || data.doctor,
      service: data.service || data.specialty,
      date: data.date,
      time: data.time,
      isComplete: false,
      missingFields: []
    }

    // Check for required fields
    const requiredFields = ['patientName', 'phone', 'specialist', 'date', 'time']
    details.missingFields = requiredFields.filter(field => !details[field as keyof BookingDetails])
    details.isComplete = details.missingFields.length === 0

    return details
  } catch (error) {
    // Dynamic import to avoid circular dependency
    import('@/shared/utils/logger').then(({ logError }) => {
      logError('Error parsing booking details', error)
    }).catch(() => {
      // Logger not available, ignore
    })
    return null
  }
}

/**
 * Check if message contains booking keywords
 */
export function hasBookingIntent(message: string): boolean {
  const bookingKeywords = [
    'حجز',
    'موعد',
    'appointment',
    'book',
    'schedule',
    'أريد موعد',
    'أبغى موعد',
    'احجز',
    'جدولة'
  ]

  const lowerMessage = message.toLowerCase()
  return bookingKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))
}

/**
 * Format date for display
 */
export function formatAppointmentDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

/**
 * Format time for display
 */
export function formatAppointmentTime(timeStr: string): string {
  try {
    // Handle various time formats
    const time = timeStr.toLowerCase()
    
    // Convert to 12-hour format if needed
    if (time.includes('صباحاً') || time.includes('am')) {
      return time
    }
    
    if (time.includes('مساءً') || time.includes('pm')) {
      return time
    }

    // Parse 24-hour format
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'مساءً' : 'صباحاً'
    const displayHours = hours > 12 ? hours - 12 : hours
    
    return `${displayHours}:${minutes?.toString().padStart(2, '0') || '00'} ${period}`
  } catch {
    return timeStr
  }
}
