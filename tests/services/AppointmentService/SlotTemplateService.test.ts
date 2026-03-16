import SlotTemplateService from '@/services/AppointmentService/SlotTemplateService'
import redis from '@/libs/redis'
import type { Day, Slot } from '@/types/features/CalendarTypes'

const redisMock = redis as jest.Mocked<typeof redis>

const makeSlot = (start: string, end: string): Slot => ({
  startTime: new Date(start),
  endTime: new Date(end),
  capacity: 1,
})

const MONDAY: Day = 'MONDAY'

describe('SlotTemplateService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── createOrUpdateSlotTemplate ────────────────────────────────────────
  describe('createOrUpdateSlotTemplate', () => {
    it('stores template in redis and returns it', async () => {
      redisMock.set.mockResolvedValue('OK')
      const slots = [makeSlot('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z')]
      const result = await SlotTemplateService.createOrUpdateSlotTemplate(MONDAY, slots)

      expect(redisMock.set).toHaveBeenCalledWith(
        'slot_template:MONDAY',
        expect.any(String)
      )
      expect(result.day).toBe(MONDAY)
      expect(result.slots).toHaveLength(1)
    })
  })

  // ── getSlotTemplate ───────────────────────────────────────────────────
  describe('getSlotTemplate', () => {
    it('returns parsed template when key exists', async () => {
      const template = { day: MONDAY, slots: [] }
      redisMock.get.mockResolvedValueOnce(JSON.stringify(template))

      const result = await SlotTemplateService.getSlotTemplate(MONDAY)
      expect(result.day).toBe(MONDAY)
    })

    it('returns empty template when key not found', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      const result = await SlotTemplateService.getSlotTemplate(MONDAY)
      expect(result).toEqual({ day: MONDAY, slots: [] })
    })
  })

  // ── emptySlotTemplate ─────────────────────────────────────────────────
  describe('emptySlotTemplate', () => {
    it('sets template with empty slots array', async () => {
      redisMock.set.mockResolvedValue('OK')
      const result = await SlotTemplateService.emptySlotTemplate(MONDAY)

      expect(result.slots).toEqual([])
      expect(redisMock.set).toHaveBeenCalledWith(
        'slot_template:MONDAY',
        JSON.stringify({ day: MONDAY, slots: [] })
      )
    })
  })

  // ── getAllSlotTemplates ────────────────────────────────────────────────
  describe('getAllSlotTemplates', () => {
    it('returns empty array when no keys found', async () => {
      redisMock.keys.mockResolvedValueOnce([])
      const result = await SlotTemplateService.getAllSlotTemplates()
      expect(result).toEqual([])
    })

    it('returns all templates for found keys', async () => {
      const template = { day: MONDAY, slots: [] }
      redisMock.keys.mockResolvedValueOnce(['slot_template:MONDAY'])
      redisMock.get.mockResolvedValueOnce(JSON.stringify(template))

      const result = await SlotTemplateService.getAllSlotTemplates()
      expect(result).toHaveLength(1)
      expect(result[0].day).toBe(MONDAY)
    })

    it('filters out null values from missing keys', async () => {
      redisMock.keys.mockResolvedValueOnce(['slot_template:MONDAY', 'slot_template:TUESDAY'])
      redisMock.get
        .mockResolvedValueOnce(JSON.stringify({ day: MONDAY, slots: [] }))
        .mockResolvedValueOnce(null)

      const result = await SlotTemplateService.getAllSlotTemplates()
      expect(result).toHaveLength(1)
    })
  })
})
