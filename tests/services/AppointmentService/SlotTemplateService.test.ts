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

// ── Phase 18: SlotTemplateService consistency extensions ──────────────────

describe('SlotTemplateService — Phase 18 consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset slot service mocks to avoid mockImplementation bleed-over from earlier tests
    slotServiceMock.createSlot.mockReset()
    slotServiceMock.getAllSlotsForDate.mockReset()
  })

  // ── createOrUpdateSlotTemplate: invalid time ranges ───────────────────
  describe('createOrUpdateSlotTemplate — invalid time ranges', () => {
    it('throws when a slot has startTime >= endTime (same time)', async () => {
      const slots = [makeSlot('2024-01-01T10:00:00Z', '2024-01-01T10:00:00Z')]
      await expect(
        SlotTemplateService.createOrUpdateSlotTemplate(MONDAY, slots)
      ).rejects.toThrow('Template slot startTime must be before endTime')
      expect(redisMock.set).not.toHaveBeenCalled()
    })

    it('throws when a slot has startTime after endTime', async () => {
      const slots = [makeSlot('2024-01-01T11:00:00Z', '2024-01-01T09:00:00Z')]
      await expect(
        SlotTemplateService.createOrUpdateSlotTemplate(MONDAY, slots)
      ).rejects.toThrow('Template slot startTime must be before endTime')
      expect(redisMock.set).not.toHaveBeenCalled()
    })

    it('throws when slots span midnight (different dates)', async () => {
      const slots = [makeSlot('2024-01-01T23:00:00Z', '2024-01-02T01:00:00Z')]
      await expect(
        SlotTemplateService.createOrUpdateSlotTemplate(MONDAY, slots)
      ).rejects.toThrow('Template slot startTime and endTime must be on the same date')
      expect(redisMock.set).not.toHaveBeenCalled()
    })
  })

  // ── applySlotTemplateToDate: correct slot count ───────────────────────
  describe('applySlotTemplateToDate — correct slot count', () => {
    it('generates the correct number of slots when no existing slots conflict', async () => {
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          day: MONDAY,
          slots: [
            makeSlot('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z'),
            makeSlot('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
            makeSlot('2024-01-01T11:00:00Z', '2024-01-01T12:00:00Z'),
          ],
        })
      )

      slotServiceMock.getAllSlotsForDate.mockResolvedValueOnce([])
      slotServiceMock.createSlot.mockImplementation(async (slot) => slot)

      const created = await SlotTemplateService.applySlotTemplateToDate(MONDAY, '2024-01-08')

      // All 3 slots should be created since no existing ones conflict
      expect(slotServiceMock.createSlot).toHaveBeenCalledTimes(3)
      expect(created).toHaveLength(3)
    })

    it('skips all slots when every template slot conflicts with existing data', async () => {
      const templateSlots = [
        makeSlot('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z'),
        makeSlot('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
      ]

      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({ day: MONDAY, slots: templateSlots })
      )

      // Existing slots for the target date cover all template times
      slotServiceMock.getAllSlotsForDate.mockResolvedValueOnce([
        makeSlot('2024-01-08T09:00:00Z', '2024-01-08T10:00:00Z'),
        makeSlot('2024-01-08T10:00:00Z', '2024-01-08T11:00:00Z'),
      ])

      const created = await SlotTemplateService.applySlotTemplateToDate(MONDAY, '2024-01-08')

      expect(slotServiceMock.createSlot).not.toHaveBeenCalled()
      expect(created).toHaveLength(0)
    })

    it('returns empty array when template has no slots', async () => {
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({ day: MONDAY, slots: [] })
      )
      slotServiceMock.getAllSlotsForDate.mockResolvedValueOnce([])

      const created = await SlotTemplateService.applySlotTemplateToDate(MONDAY, '2024-01-08')

      expect(slotServiceMock.createSlot).not.toHaveBeenCalled()
      expect(created).toHaveLength(0)
    })
  })

  // ── capacity edge case: capacity = 1 ──────────────────────────────────
  describe('createOrUpdateSlotTemplate — capacity edge cases', () => {
    it('accepts a slot with capacity = 1 (single booking possible)', async () => {
      redisMock.set.mockResolvedValue('OK')
      const slots: Slot[] = [{
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        capacity: 1,
      }]

      const result = await SlotTemplateService.createOrUpdateSlotTemplate(MONDAY, slots)

      expect(result.day).toBe(MONDAY)
      expect(result.slots).toHaveLength(1)
      expect(redisMock.set).toHaveBeenCalled()
    })

    it('preserves capacity value from template slots during applySlotTemplateToDate', async () => {
      const capacityTwo: Slot = {
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        capacity: 2,
      }

      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({ day: MONDAY, slots: [capacityTwo] })
      )
      slotServiceMock.getAllSlotsForDate.mockResolvedValueOnce([])
      slotServiceMock.createSlot.mockImplementation(async (slot) => slot)

      await SlotTemplateService.applySlotTemplateToDate(MONDAY, '2024-01-08')

      const createdSlotArg = (slotServiceMock.createSlot as jest.Mock).mock.calls[0][0] as Slot
      expect(createdSlotArg.capacity).toBe(2)
    })
  })
})
