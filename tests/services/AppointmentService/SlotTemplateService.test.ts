import SlotTemplateService from '@/services/AppointmentService/SlotTemplateService'
import SlotService from '@/services/AppointmentService/SlotService'
import redis from '@/libs/redis'
import type { Day, Slot } from '@/types/features/CalendarTypes'

jest.mock('@/services/AppointmentService/SlotService', () => ({
  __esModule: true,
  default: {
    getAllSlotsForDate: jest.fn(),
    createSlot: jest.fn(),
  },
}))

const redisMock = redis as jest.Mocked<typeof redis>
const slotServiceMock = SlotService as jest.Mocked<typeof SlotService>

const makeSlot = (start: string, end: string): Slot => ({
  startTime: new Date(start),
  endTime: new Date(end),
  capacity: 1,
})

const MONDAY: Day = 'monday'

describe('SlotTemplateService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── createOrUpdateSlotTemplate ────────────────────────────────────────
  describe('createOrUpdateSlotTemplate', () => {
    it('stores template in redis and returns it', async () => {
      redisMock.set.mockResolvedValue('OK')
      const slots = [makeSlot('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z')]
      const result = await SlotTemplateService.createOrUpdateSlotTemplate(MONDAY, slots)

      expect(redisMock.set).toHaveBeenCalledWith(
        'slot_template:monday',
        expect.any(String)
      )
      expect(result.day).toBe(MONDAY)
      expect(result.slots).toHaveLength(1)
    })

    it('rejects overlapping template slots to prevent unsafe apply', async () => {
      const slots = [
        makeSlot('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z'),
        makeSlot('2024-01-01T09:30:00Z', '2024-01-01T10:30:00Z'),
      ]

      await expect(
        SlotTemplateService.createOrUpdateSlotTemplate(MONDAY, slots)
      ).rejects.toThrow('Template contains overlapping slots')

      expect(redisMock.set).not.toHaveBeenCalled()
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
        'slot_template:monday',
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
      redisMock.keys.mockResolvedValueOnce(['slot_template:monday'])
      redisMock.get.mockResolvedValueOnce(JSON.stringify(template))

      const result = await SlotTemplateService.getAllSlotTemplates()
      expect(result).toHaveLength(1)
      expect(result[0].day).toBe(MONDAY)
    })

    it('filters out null values from missing keys', async () => {
      redisMock.keys.mockResolvedValueOnce(['slot_template:monday', 'slot_template:tuesday'])
      redisMock.get
        .mockResolvedValueOnce(JSON.stringify({ day: MONDAY, slots: [] }))
        .mockResolvedValueOnce(null)

      const result = await SlotTemplateService.getAllSlotTemplates()
      expect(result).toHaveLength(1)
    })
  })

  // ── applySlotTemplateToDate ───────────────────────────────────────────
  describe('applySlotTemplateToDate', () => {
    it('creates only non-overlapping slots and does not overwrite existing slots', async () => {
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          day: MONDAY,
          slots: [
            makeSlot('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z'),
            makeSlot('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
          ],
        })
      )

      slotServiceMock.getAllSlotsForDate.mockResolvedValueOnce([
        makeSlot('2024-01-08T09:00:00Z', '2024-01-08T10:00:00Z'),
      ])
      slotServiceMock.createSlot.mockImplementation(async (slot) => slot)

      const created = await SlotTemplateService.applySlotTemplateToDate(MONDAY, '2024-01-08')

      expect(slotServiceMock.createSlot).toHaveBeenCalledTimes(1)
      const createdSlotArg = (slotServiceMock.createSlot as jest.Mock).mock.calls[0][0] as Slot
      expect(createdSlotArg.startTime.toISOString()).toBe('2024-01-08T10:00:00.000Z')
      expect(createdSlotArg.endTime.toISOString()).toBe('2024-01-08T11:00:00.000Z')
      expect(created).toHaveLength(1)
    })

    it('rejects overlap edge-case inside template during apply', async () => {
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          day: MONDAY,
          slots: [
            makeSlot('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z'),
            makeSlot('2024-01-01T09:45:00Z', '2024-01-01T10:15:00Z'),
          ],
        })
      )
      slotServiceMock.getAllSlotsForDate.mockResolvedValueOnce([])

      await expect(
        SlotTemplateService.applySlotTemplateToDate(MONDAY, '2024-01-08')
      ).rejects.toThrow('Template contains overlapping slots')

      expect(slotServiceMock.createSlot).not.toHaveBeenCalled()
    })
  })
})
