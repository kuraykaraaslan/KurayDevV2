import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import Logger from '@/libs/logger'

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
    Logger.error('Failed to parse datetime:' + err.message)
    throw new Error(`Invalid datetime format: ${datetime}`)
  }
}
