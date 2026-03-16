import { Day, Slot, SlotTemplate } from '@/types/features/CalendarTypes'

import redisInstance from '@/libs/redis'
import { separateDateTimeWithTimeZone } from '@/helpers/TimeHelper'
import SlotService from './SlotService'

export default class SlotTemplateService {
  static SLOT_TEMPLATE_PREFIX = 'slot_template:'

  private static toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((n) => Number(n))
    return hours * 60 + minutes
  }

  private static normalizeSlotTimes(slots: Slot[]): Array<{ startTime: string; endTime: string; capacity: number }> {
    return slots
      .map((slot) => {
        const start = new Date(slot.startTime)
        const end = new Date(slot.endTime)

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          throw new Error('Invalid slot datetime in template')
        }

        const { date: startDate, time: startTime } = separateDateTimeWithTimeZone(start)
        const { date: endDate, time: endTime } = separateDateTimeWithTimeZone(end)

        if (startDate !== endDate) {
          throw new Error('Template slot startTime and endTime must be on the same date')
        }
        if (startTime >= endTime) {
          throw new Error('Template slot startTime must be before endTime')
        }

        return { startTime, endTime, capacity: slot.capacity }
      })
      .sort((a, b) => this.toMinutes(a.startTime) - this.toMinutes(b.startTime))
  }

  private static assertNoOverlaps(slots: Array<{ startTime: string; endTime: string }>): void {
    for (let i = 1; i < slots.length; i++) {
      const prev = slots[i - 1]
      const current = slots[i]
      if (this.toMinutes(current.startTime) < this.toMinutes(prev.endTime)) {
        throw new Error('Template contains overlapping slots')
      }
    }
  }

  private static buildDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00.000Z`)
  }

  static async createOrUpdateSlotTemplate(day: Day, slots: Slot[]): Promise<SlotTemplate> {
    const normalized = this.normalizeSlotTimes(slots)
    this.assertNoOverlaps(normalized)

    const key = `${this.SLOT_TEMPLATE_PREFIX}${day}`
    const template: SlotTemplate = { day, slots }
    await redisInstance.set(key, JSON.stringify(template))
    return template
  }

  static async getSlotTemplate(day: Day): Promise<SlotTemplate> {
    const key = `${this.SLOT_TEMPLATE_PREFIX}${day}`
    const value = await redisInstance.get(key)
    if (value) {
      return JSON.parse(value)
    }

    return { day, slots: [] }
  }

  static async emptySlotTemplate(day: Day): Promise<SlotTemplate> {
    const key = `${this.SLOT_TEMPLATE_PREFIX}${day}`
    const template: SlotTemplate = { day, slots: [] }
    await redisInstance.set(key, JSON.stringify(template))
    return template
  }

  static async getAllSlotTemplates(): Promise<SlotTemplate[]> {
    const keys = await redisInstance.keys(`${this.SLOT_TEMPLATE_PREFIX}*`)
    if (keys.length === 0) return []

    const templates = await Promise.all(
      keys.map(async (key) => {
        const value = await redisInstance.get(key)
        if (value) {
          return JSON.parse(value)
        }
        return null
      })
    )
    return templates.filter((template): template is SlotTemplate => template !== null)
  }

  static async applySlotTemplateToDate(day: Day, formattedDate: string): Promise<Slot[]> {
    const normalizedDate = new Date(`${formattedDate}T00:00:00.000Z`)
    if (Number.isNaN(normalizedDate.getTime())) {
      throw new Error('Invalid formattedDate')
    }

    const template = await this.getSlotTemplate(day)
    if (!template.slots.length) return []

    const normalizedTemplateSlots = this.normalizeSlotTimes(template.slots)
    this.assertNoOverlaps(normalizedTemplateSlots)

    const existingSlots = await SlotService.getAllSlotsForDate(formattedDate)
    const occupied = existingSlots.map((slot) => {
      const { time: startTime } = separateDateTimeWithTimeZone(new Date(slot.startTime))
      const { time: endTime } = separateDateTimeWithTimeZone(new Date(slot.endTime))
      return { startTime, endTime }
    })

    const created: Slot[] = []
    for (const slot of normalizedTemplateSlots) {
      const overlapsExisting = occupied.some(
        (current) =>
          this.toMinutes(slot.startTime) < this.toMinutes(current.endTime) &&
          this.toMinutes(slot.endTime) > this.toMinutes(current.startTime)
      )

      if (overlapsExisting) continue

      const slotData: Slot = {
        startTime: this.buildDateTime(formattedDate, slot.startTime),
        endTime: this.buildDateTime(formattedDate, slot.endTime),
        capacity: slot.capacity,
      }

      try {
        const createdSlot = await SlotService.createSlot(slotData)
        created.push(createdSlot)
        occupied.push({ startTime: slot.startTime, endTime: slot.endTime })
      } catch (error: any) {
        if (typeof error?.message === 'string' && error.message.startsWith('Overlapping slot exists:')) {
          continue
        }
        throw error
      }
    }

    return created
  }
}
