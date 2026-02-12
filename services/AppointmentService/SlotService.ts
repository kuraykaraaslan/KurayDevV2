import redisInstance from '@/libs/redis'
import { Slot } from '@/types/features/CalendarTypes'
import { format, parse } from 'date-fns'
import { separateDateTimeWithTimeZone } from '@/helpers/TimeHelper'

export default class SlotService {
  static SLOT_PREFIX = 'slot:{date}:{time}'

  private static makeKey(date: string, time: string): string {
    return this.SLOT_PREFIX.replace('{date}', date).replace('{time}', time)
  }

  private static async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = []
    let cursor = '0'
    do {
      const [next, found] = await redisInstance.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      keys.push(...found)
      cursor = next
    } while (cursor !== '0')
    return keys
  }

  private static async getOverlappingSlots(
    date: string,
    startTime: string,
    endTime: string
  ): Promise<Slot | null> {
    const pattern = this.makeKey(date, '*')
    const keys = await this.scanKeys(pattern)

    const newStart = parse(startTime, 'HH:mm', new Date())
    const newEnd = parse(endTime, 'HH:mm', new Date())

    for (const key of keys) {
      const value = await redisInstance.get(key)
      if (value) {
        const slot: Slot = JSON.parse(value)
        const slotStart = parse(format(slot.startTime, 'HH:mm'), 'HH:mm', new Date())
        const slotEnd = parse(format(slot.endTime, 'HH:mm'), 'HH:mm', new Date())
        if (newStart < slotEnd && newEnd > slotStart) {
          return slot
        }
      }
    }
    return null
  }

  static async createSlot(slot: Slot): Promise<Slot> {
    const { date: startDate, time: startTime } = separateDateTimeWithTimeZone(slot.startTime)
    const { date: endDate, time: endTime } = separateDateTimeWithTimeZone(slot.endTime)

    if (startDate !== endDate)
      throw new Error('Slot startTime and endTime must be on the same date')
    if (startTime >= endTime) throw new Error('Slot startTime must be before endTime')

    const overlappingSlot = await this.getOverlappingSlots(startDate, startTime, endTime)
    if (overlappingSlot) {
      throw new Error(
        `Overlapping slot exists: ${format(overlappingSlot.startTime, 'HH:mm')} - ${format(overlappingSlot.endTime, 'HH:mm')}`
      )
    }

    const key = this.makeKey(startDate, startTime)
    const ttlSeconds = 60 * 60 * 24 * 14 // 14 days retention
    await redisInstance.set(key, JSON.stringify(slot), 'EX', ttlSeconds)
    return slot
  }

  static async getSlot(date: string, time: string): Promise<Slot | null> {
    const key = this.makeKey(date, time)
    const value = await redisInstance.get(key)
    return value ? (JSON.parse(value) as Slot) : null
  }

  static async updateSlot(slot: Slot): Promise<Slot> {
    const { date, time } = separateDateTimeWithTimeZone(slot.startTime)
    const key = this.makeKey(date, time)
    await redisInstance.set(key, JSON.stringify(slot))
    return slot
  }

  static async deleteSlot(date: string, time: string): Promise<boolean> {
    const key = this.makeKey(date, time)
    const result = await redisInstance.del(key)
    return result > 0
  }

  static async getAllSlotsForDate(date: string): Promise<Slot[]> {
    const pattern = this.makeKey(date, '*')
    const keys = await this.scanKeys(pattern)
    if (!keys.length) return []
    const values = await redisInstance.mget(keys)
    return values.filter((v): v is string => !!v).map((v) => JSON.parse(v) as Slot)
  }

  static async emptySlotsForDate(date: Date): Promise<void> {
    const { date: formattedDate } = separateDateTimeWithTimeZone(date)
    const pattern = this.makeKey(formattedDate, '*')
    const keys = await this.scanKeys(pattern)
    if (keys.length) await redisInstance.del(...keys)
  }

  static async getAllSlotsForDateRange(params: {
    startDate?: string
    endDate?: string
  }): Promise<{ slots: Slot[]; total: number }> {
    const { startDate, endDate } = params
    if (!startDate && !endDate)
      throw new Error('At least one of startDate or endDate must be provided')

    const start = startDate ? new Date(startDate) : new Date('1970-01-01')
    const end = endDate ? new Date(endDate) : new Date('2100-01-01')

    if (start > end) throw new Error('startDate cannot be after endDate')

    const dates: string[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(format(new Date(d), 'yyyy-MM-dd'))
    }

    const allSlots = (await Promise.all(dates.map((d) => this.getAllSlotsForDate(d)))).flat()
    return { slots: allSlots, total: allSlots.length }
  }
}
