import SlotService from '@/services/AppointmentService/SlotService'
import redis from '@/libs/redis'
import type { Slot } from '@/types/features/CalendarTypes'

const redisMock = redis as jest.Mocked<typeof redis>

const makeSlot = (startISO: string, endISO: string, capacity = 1): Slot => ({
  startTime: new Date(startISO),
  endTime: new Date(endISO),
  capacity,
})

describe('SlotService', () => {
  beforeEach(() => jest.resetAllMocks())

  // ── makeKey (via createSlot key shape) ──────────────────────────────
  describe('createSlot', () => {
    it('throws when startTime and endTime are on different dates', async () => {
      const slot = makeSlot('2024-03-10T10:00:00Z', '2024-03-11T11:00:00Z')
      await expect(SlotService.createSlot(slot)).rejects.toThrow(
        'Slot startTime and endTime must be on the same date'
      )
    })

    it('throws when startTime >= endTime', async () => {
      const slot = makeSlot('2024-03-10T11:00:00Z', '2024-03-10T10:00:00Z')
      await expect(SlotService.createSlot(slot)).rejects.toThrow(
        'Slot startTime must be before endTime'
      )
    })

    it('stores slot in redis on success', async () => {
      redisMock.scan.mockResolvedValueOnce(['0', []])
      redisMock.set.mockResolvedValue('OK')

      const slot = makeSlot('2024-03-10T10:00:00Z', '2024-03-10T11:00:00Z')
      const result = await SlotService.createSlot(slot)

      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('slot:'),
        expect.any(String),
        'EX',
        expect.any(Number)
      )
      expect(result).toEqual(slot)
    })
  })

  // ── getSlot ──────────────────────────────────────────────────────────
  describe('getSlot', () => {
    it('returns null when key not in redis', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      const result = await SlotService.getSlot('2024-03-10', '10:00')
      expect(result).toBeNull()
    })

    it('returns parsed slot when key exists', async () => {
      const slot = makeSlot('2024-03-10T10:00:00Z', '2024-03-10T11:00:00Z')
      redisMock.get.mockResolvedValueOnce(JSON.stringify(slot))
      const result = await SlotService.getSlot('2024-03-10', '10:00')
      expect(result).not.toBeNull()
    })
  })

  // ── deleteSlot ───────────────────────────────────────────────────────
  describe('deleteSlot', () => {
    it('returns true when redis del removes 1 key', async () => {
      redisMock.del.mockResolvedValue(1)
      const result = await SlotService.deleteSlot('2024-03-10', '10:00')
      expect(result).toBe(true)
    })

    it('returns false when key did not exist', async () => {
      redisMock.del.mockResolvedValue(0)
      const result = await SlotService.deleteSlot('2024-03-10', '99:99')
      expect(result).toBe(false)
    })
  })

  // ── getAllSlotsForDate ────────────────────────────────────────────────
  describe('getAllSlotsForDate', () => {
    it('returns empty array when no keys found', async () => {
      redisMock.scan.mockResolvedValueOnce(['0', []])
      const result = await SlotService.getAllSlotsForDate('2024-03-10')
      expect(result).toEqual([])
    })

    it('returns parsed slots for each key', async () => {
      const slot = makeSlot('2024-03-10T10:00:00Z', '2024-03-10T11:00:00Z')
      redisMock.scan.mockResolvedValueOnce(['0', ['slot:2024-03-10:10:00']])
      redisMock.mget.mockResolvedValueOnce([JSON.stringify(slot)])
      const result = await SlotService.getAllSlotsForDate('2024-03-10')
      expect(result).toHaveLength(1)
    })
  })

  // ── getAllSlotsForDateRange ───────────────────────────────────────────
  describe('getAllSlotsForDateRange', () => {
    it('throws when neither startDate nor endDate provided', async () => {
      await expect(SlotService.getAllSlotsForDateRange({})).rejects.toThrow(
        'At least one of startDate or endDate must be provided'
      )
    })

    it('throws when startDate is after endDate', async () => {
      await expect(
        SlotService.getAllSlotsForDateRange({ startDate: '2024-03-15', endDate: '2024-03-10' })
      ).rejects.toThrow('startDate cannot be after endDate')
    })

    it('returns aggregated slots for date range', async () => {
      redisMock.scan.mockResolvedValue(['0', []])
      const result = await SlotService.getAllSlotsForDateRange({
        startDate: '2024-03-10', endDate: '2024-03-11',
      })
      expect(result).toHaveProperty('slots')
      expect(result).toHaveProperty('total')
    })
  })
})
