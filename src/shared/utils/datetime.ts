/**
 * Date/Time Utilities
 * Centralized date formatting and manipulation
 */

// ============================================================================
// Types
// ============================================================================

export type DateFormat = 'short' | 'long' | 'time' | 'datetime' | 'relative' | 'iso'

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formats a date according to the specified format
 */
export function formatDate(date: Date | string, format: DateFormat = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return 'تاريخ غير صحيح'
  }

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

    case 'long':
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })

    case 'time':
      return dateObj.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
      })

    case 'datetime':
      return dateObj.toLocaleString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

    case 'relative':
      return formatRelativeTime(dateObj)

    case 'iso':
      return dateObj.toISOString()

    default:
      return dateObj.toLocaleDateString('ar-SA')
  }
}

/**
 * Formats a date as relative time (e.g., "منذ ساعتين")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'الآن'
  } else if (diffMinutes < 60) {
    return `منذ ${diffMinutes} ${diffMinutes === 1 ? 'دقيقة' : 'دقائق'}`
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`
  } else if (diffDays < 7) {
    return `منذ ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`
  } else {
    return formatDate(dateObj, 'short')
  }
}

/**
 * Parses a date string
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string')
  }
  return date
}

/**
 * Validates if a value is a valid date
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

/**
 * Checks if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.getTime() < new Date().getTime()
}

/**
 * Checks if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.getTime() > new Date().getTime()
}

/**
 * Adds days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Adds hours to a date
 */
export function addHours(date: Date | string, hours: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setHours(result.getHours() + hours)
  return result
}

/**
 * Gets the start of day
 */
export function startOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Gets the end of day
 */
export function endOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Formats date range
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === 'string' ? new Date(start) : start
  const endDate = typeof end === 'string' ? new Date(end) : end

  if (isToday(startDate) && isToday(endDate)) {
    return 'اليوم'
  }

  return `${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}`
}

// ============================================================================
// Export Object
// ============================================================================

export const DateTime = {
  format: formatDate,
  formatRelative: formatRelativeTime,
  parse: parseDate,
  isValid: isValidDate,
  isToday,
  isPast,
  isFuture,
  addDays,
  addHours,
  startOfDay,
  endOfDay,
  formatRange: formatDateRange,
}
