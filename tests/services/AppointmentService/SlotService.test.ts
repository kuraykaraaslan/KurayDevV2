import SlotService from '@/services/AppointmentService/SlotService'
import redisInstance from '@/libs/redis'

describe('SlotService', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a valid slot', async () => {
    const slot = { startTime: '2025-05-01T10:00:00Z', endTime: '2025-05-01T11:00:00Z' }
    jest.spyOn(redisInstance, 'set').mockResolvedValue('OK')
    const result = await SlotService.createSlot(slot as any)
    expect(result).toEqual(slot)
  })

  it('throws on overlapping slots', async () => {
    jest.spyOn(SlotService as any, 'getOverlappingSlots').mockResolvedValue({
      startTime: '2025-05-01T10:00:00Z',
      endTime: '2025-05-01T11:00:00Z'
    })
    const slot = { startTime: '2025-05-01T10:30:00Z', endTime: '2025-05-01T11:30:00Z' }
    await expect(SlotService.createSlot(slot as any))
      .rejects.toThrow('Overlapping slot exists')
  })
})
