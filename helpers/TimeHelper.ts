import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatShortDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function separateDateTimeWithTimeZone(
  datetime: Date,
  timeZone = 'UTC'
): { date: string; time: string } {
  try {
    const zoned = toZonedTime(datetime, timeZone)
    const date = format(zoned, 'yyyy-MM-dd')
    const time = format(zoned, 'HH:mm')
    return { date, time }
  } catch (err: any) {
    console.error('Failed to parse datetime:' + err.message)
    throw new Error(`Invalid datetime format: ${datetime}`)
  }
}
