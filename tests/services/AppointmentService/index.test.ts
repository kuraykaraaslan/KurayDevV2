import AppointmentService from '@/services/AppointmentService'
import { prisma } from '@/libs/prisma'
import SlotService from '@/services/AppointmentService/SlotService'
import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import type { Appointment, Slot } from '@/types/features/CalendarTypes'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    appointment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/services/AppointmentService/SlotService', () => ({
  __esModule: true,
  default: {
    getSlot: jest.fn(),
    updateSlot: jest.fn(),
  },
}))

jest.mock('@/libs/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))

const prismaMock = prisma as any
const redisMock = redis as jest.Mocked<typeof redis>
const slotServiceMock = SlotService as jest.Mocked<typeof SlotService>
const loggerMock = Logger as jest.Mocked<typeof Logger>

const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  appointmentId: 'apt-1',
  startTime: new Date('2026-03-20T10:00:00Z'),
  endTime: new Date('2026-03-20T10:30:00Z'),
  name: 'Ada Lovelace',
  email: 'owner@example.com',
  phone: '+900000000',
  note: null,
  status: 'PENDING',
  createdAt: new Date('2026-03-01T00:00:00Z'),
  ...overrides,
})

const makeSlot = (capacity = 1): Slot => ({
  startTime: new Date('2026-03-20T10:00:00Z'),
  endTime: new Date('2026-03-20T10:30:00Z'),
  capacity,
})

describe('AppointmentService', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    prismaMock.$transaction.mockImplementation(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg({
          appointment: {
            create: prismaMock.appointment.create,
            update: prismaMock.appointment.update,
          },
        })
      }

      return Promise.all(arg)
    })
  })

  describe('bookAppointment', () => {
    it('rejects when booking lock is already held', async () => {
      redisMock.set.mockResolvedValueOnce(null)

      await expect(AppointmentService.bookAppointment('apt-1')).rejects.toThrow(
        'Booking operation already in progress'
      )

      expect(prismaMock.appointment.findUnique).not.toHaveBeenCalled()
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('Booking conflict for apt-1: lock already held')
      )
    })

    it('rejects booking when appointment is at now boundary', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-20T10:00:00Z'))

      try {
        redisMock.set.mockResolvedValueOnce('OK')
        redisMock.del.mockResolvedValue(1)
        prismaMock.appointment.findUnique.mockResolvedValueOnce(
          makeAppointment({ startTime: new Date('2026-03-20T10:00:00Z'), status: 'PENDING' })
        )

        await expect(AppointmentService.bookAppointment('apt-1')).rejects.toThrow(
          'Cannot book past or ongoing appointment'
        )

        expect(slotServiceMock.getSlot).not.toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
      }
    })

    it('blocks booking a cancelled appointment (illegal transition)', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ status: 'CANCELLED' })
      )

      await expect(AppointmentService.bookAppointment('apt-1')).rejects.toThrow(
        'Cannot book cancelled appointment'
      )

      expect(slotServiceMock.getSlot).not.toHaveBeenCalled()
      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })

    it('blocks booking a completed appointment (illegal transition)', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ status: 'COMPLETED' })
      )

      await expect(AppointmentService.bookAppointment('apt-1')).rejects.toThrow(
        'Cannot book completed appointment'
      )

      expect(slotServiceMock.getSlot).not.toHaveBeenCalled()
      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })

    it('allows only one of two concurrent booking attempts (race guard)', async () => {
      const appointment = makeAppointment()
      const slot = makeSlot(1)

      redisMock.set
        .mockResolvedValueOnce('OK')
        .mockResolvedValueOnce(null)
      redisMock.del.mockResolvedValue(1)

      prismaMock.appointment.findUnique.mockResolvedValue(appointment)
      slotServiceMock.getSlot.mockResolvedValue(slot)
      prismaMock.appointment.update.mockResolvedValue({ ...appointment, status: 'BOOKED' })
      slotServiceMock.updateSlot.mockResolvedValue({ ...slot, capacity: 0 })

      const [first, second] = await Promise.allSettled([
        AppointmentService.bookAppointment('apt-1'),
        AppointmentService.bookAppointment('apt-1'),
      ])

      const fulfilled = [first, second].filter(
        (result): result is PromiseFulfilledResult<Appointment> => result.status === 'fulfilled'
      )
      const rejected = [first, second].filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
      )

      expect(fulfilled).toHaveLength(1)
      expect(rejected).toHaveLength(1)
      expect(rejected[0].reason.message).toBe('Booking operation already in progress')
    })
  })

  describe('cancelAppointment', () => {
    it('rejects non-owner cancellation attempt', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ email: 'owner@example.com', status: 'BOOKED' })
      )

      await expect(
        AppointmentService.cancelAppointment('apt-1', { requesterEmail: 'attacker@example.com' })
      ).rejects.toThrow('Forbidden: cannot cancel another user appointment')

      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cancellation conflict for apt-1: forbidden requester attacker@example.com')
      )
    })

    it('allows admin override for ownership check', async () => {
      const appointment = makeAppointment({ email: 'owner@example.com', status: 'BOOKED' })

      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(appointment)
      slotServiceMock.getSlot.mockResolvedValueOnce(null)
      prismaMock.appointment.update.mockResolvedValueOnce({ ...appointment, status: 'CANCELLED' })

      const result = await AppointmentService.cancelAppointment('apt-1', {
        requesterEmail: 'attacker@example.com',
        isAdmin: true,
      })

      expect(result.status).toBe('CANCELLED')
      expect(prismaMock.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { appointmentId: 'apt-1' },
          data: { status: 'CANCELLED' },
        })
      )
    })

    it('rejects cancellation when appointment is not booked', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ status: 'PENDING' })
      )

      await expect(AppointmentService.cancelAppointment('apt-1')).rejects.toThrow(
        'Only booked appointments can be cancelled'
      )

      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })

    it('rejects cancellation for past or ongoing appointments (now boundary)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-20T10:30:00Z'))

      try {
        redisMock.set.mockResolvedValueOnce('OK')
        redisMock.del.mockResolvedValue(1)
        prismaMock.appointment.findUnique.mockResolvedValueOnce(
          makeAppointment({ status: 'BOOKED', startTime: new Date('2026-03-20T10:30:00Z') })
        )

        await expect(AppointmentService.cancelAppointment('apt-1')).rejects.toThrow(
          'Cannot cancel past or ongoing appointment'
        )

        expect(prismaMock.appointment.update).not.toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
      }
    })
  })
})

// ── Phase 18: Appointment consistency extensions ───────────────────────────

describe('AppointmentService — Phase 18 consistency', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    prismaMock.$transaction.mockImplementation(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg({
          appointment: {
            create: prismaMock.appointment.create,
            update: prismaMock.appointment.update,
          },
        })
      }
      return Promise.all(arg)
    })
  })

  // ── bookAppointment: slot already at capacity = 0 ─────────────────────
  describe('bookAppointment — capacity = 0 slot', () => {
    it('rejects when slot has capacity = 0', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ status: 'PENDING', startTime: new Date('2027-06-01T10:00:00Z') })
      )
      slotServiceMock.getSlot.mockResolvedValueOnce(makeSlot(0))

      await expect(AppointmentService.bookAppointment('apt-1')).rejects.toThrow(
        'No available capacity'
      )

      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })
  })

  // ── bookAppointment: slot is already taken (BOOKED status guard) ──────
  describe('bookAppointment — slot already taken', () => {
    it('throws conflict error when appointment is already BOOKED', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ status: 'BOOKED' })
      )

      await expect(AppointmentService.bookAppointment('apt-1')).rejects.toThrow('Already booked')

      expect(slotServiceMock.getSlot).not.toHaveBeenCalled()
      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })
  })

  // ── bookAppointment then cancelAppointment: slot capacity restored ─────
  describe('bookAppointment then cancelAppointment — slot restoration', () => {
    it('slot becomes available again after cancel following a book', async () => {
      const appointment = makeAppointment({ status: 'PENDING', startTime: new Date('2027-06-01T10:00:00Z') })
      const slot = makeSlot(1)

      // --- book path ---
      redisMock.set.mockResolvedValueOnce('OK') // book lock acquired
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(appointment)
      slotServiceMock.getSlot.mockResolvedValueOnce(slot)
      prismaMock.appointment.update.mockResolvedValueOnce({ ...appointment, status: 'BOOKED' })
      slotServiceMock.updateSlot.mockResolvedValueOnce({ ...slot, capacity: 0 })

      const booked = await AppointmentService.bookAppointment('apt-1')
      expect(booked.status).toBe('BOOKED')

      // verify capacity was decremented
      expect(slotServiceMock.updateSlot).toHaveBeenCalledWith(
        expect.objectContaining({ capacity: 0 })
      )

      // --- cancel path ---
      redisMock.set.mockResolvedValueOnce('OK') // cancel lock acquired
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ status: 'BOOKED', startTime: new Date('2027-06-01T10:00:00Z') })
      )
      const zeroCapacitySlot = { ...slot, capacity: 0 }
      slotServiceMock.getSlot.mockResolvedValueOnce(zeroCapacitySlot)
      prismaMock.appointment.update.mockResolvedValueOnce({ ...appointment, status: 'CANCELLED' })
      slotServiceMock.updateSlot.mockResolvedValueOnce({ ...zeroCapacitySlot, capacity: 1 })

      const cancelled = await AppointmentService.cancelAppointment('apt-1')
      expect(cancelled.status).toBe('CANCELLED')

      // capacity restored to 1
      expect(slotServiceMock.updateSlot).toHaveBeenLastCalledWith(
        expect.objectContaining({ capacity: 1 })
      )
    })
  })

  // ── double booking race condition ─────────────────────────────────────
  describe('bookAppointment — double booking race condition', () => {
    it('second concurrent booking attempt fails because lock is held', async () => {
      const appointment = makeAppointment({ status: 'PENDING', startTime: new Date('2027-06-01T10:00:00Z') })
      const slot = makeSlot(1)

      // First attempt acquires lock, second does not
      redisMock.set
        .mockResolvedValueOnce('OK')   // first booking: lock acquired
        .mockResolvedValueOnce(null)   // second booking: lock already held

      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValue(appointment)
      slotServiceMock.getSlot.mockResolvedValue(slot)
      prismaMock.appointment.update.mockResolvedValue({ ...appointment, status: 'BOOKED' })
      slotServiceMock.updateSlot.mockResolvedValue({ ...slot, capacity: 0 })

      const [first, second] = await Promise.allSettled([
        AppointmentService.bookAppointment('apt-1'),
        AppointmentService.bookAppointment('apt-1'),
      ])

      const fulfilled = [first, second].filter((r) => r.status === 'fulfilled')
      const rejected = [first, second].filter((r) => r.status === 'rejected')

      expect(fulfilled).toHaveLength(1)
      expect(rejected).toHaveLength(1)
      expect((rejected[0] as PromiseRejectedResult).reason.message).toBe(
        'Booking operation already in progress'
      )
    })
  })

  // ── transaction rollback: DB failure during booking ───────────────────
  describe('bookAppointment — transaction rollback on DB failure', () => {
    it('propagates error and leaves no partial state when transaction throws', async () => {
      const appointment = makeAppointment({ status: 'PENDING', startTime: new Date('2027-06-01T10:00:00Z') })
      const slot = makeSlot(1)

      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(appointment)
      slotServiceMock.getSlot.mockResolvedValueOnce(slot)

      // Transaction fails
      prismaMock.$transaction.mockRejectedValueOnce(new Error('DB connection lost'))

      await expect(AppointmentService.bookAppointment('apt-1')).rejects.toThrow('DB connection lost')

      // Lock should have been released even on failure
      expect(redisMock.del).toHaveBeenCalled()
    })
  })
})

// ── Additional coverage: createAppointment, getAppointmentById, range query, updateAppointment, getAllAppointments ──

describe('AppointmentService — additional coverage', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    prismaMock.$transaction.mockImplementation(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg({
          appointment: {
            create: prismaMock.appointment.create,
            update: prismaMock.appointment.update,
          },
        })
      }
      return Promise.all(arg)
    })
  })

  // ── createAppointment ─────────────────────────────────────────────────
  describe('createAppointment', () => {
    it('throws when slot is not found', async () => {
      slotServiceMock.getSlot.mockResolvedValueOnce(null)

      await expect(
        AppointmentService.createAppointment(makeAppointment())
      ).rejects.toThrow('Slot not found')

      expect(prismaMock.appointment.create).not.toHaveBeenCalled()
    })

    it('throws when slot has no available capacity', async () => {
      slotServiceMock.getSlot.mockResolvedValueOnce(makeSlot(0))

      await expect(
        AppointmentService.createAppointment(makeAppointment())
      ).rejects.toThrow('No available capacity for this slot')

      expect(prismaMock.appointment.create).not.toHaveBeenCalled()
    })

    it('creates appointment and decrements slot capacity on success', async () => {
      const appointment = makeAppointment()
      const slot = makeSlot(2)
      slotServiceMock.getSlot.mockResolvedValueOnce(slot)
      prismaMock.appointment.create.mockResolvedValueOnce(appointment)
      slotServiceMock.updateSlot.mockResolvedValueOnce({ ...slot, capacity: 1 })

      const result = await AppointmentService.createAppointment(appointment)

      expect(result.appointmentId).toBe('apt-1')
      expect(slotServiceMock.updateSlot).toHaveBeenCalledWith(
        expect.objectContaining({ capacity: 1 })
      )
    })
  })

  // ── getAppointmentById ────────────────────────────────────────────────
  describe('getAppointmentById', () => {
    it('returns appointment when found', async () => {
      const appointment = makeAppointment()
      prismaMock.appointment.findUnique.mockResolvedValueOnce(appointment)

      const result = await AppointmentService.getAppointmentById('apt-1')

      expect(result).not.toBeNull()
      expect(result?.appointmentId).toBe('apt-1')
      expect(prismaMock.appointment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { appointmentId: 'apt-1' } })
      )
    })

    it('returns null when appointment is not found', async () => {
      prismaMock.appointment.findUnique.mockResolvedValueOnce(null)

      const result = await AppointmentService.getAppointmentById('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ── getAppointmentsByDatetimeRange ────────────────────────────────────
  describe('getAppointmentsByDatetimeRange', () => {
    it('returns appointments within the given date range', async () => {
      const start = new Date('2026-03-20T00:00:00Z')
      const end = new Date('2026-03-20T23:59:59Z')
      const appointments = [makeAppointment(), makeAppointment({ appointmentId: 'apt-2' })]
      prismaMock.appointment.findMany.mockResolvedValueOnce(appointments)

      const result = await AppointmentService.getAppointmentsByDatetimeRange(start, end)

      expect(result).toHaveLength(2)
      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: { gte: start },
            endTime: { lte: end },
          }),
          orderBy: { startTime: 'asc' },
        })
      )
    })

    it('returns empty array when no appointments exist in range', async () => {
      prismaMock.appointment.findMany.mockResolvedValueOnce([])

      const result = await AppointmentService.getAppointmentsByDatetimeRange(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-01T23:59:59Z')
      )

      expect(result).toEqual([])
    })
  })

  // ── updateAppointment ─────────────────────────────────────────────────
  describe('updateAppointment', () => {
    it('updates appointment when no time-sensitive fields are changed', async () => {
      const existing = makeAppointment()
      const updated = { ...existing, note: 'Updated note' }
      prismaMock.appointment.findUnique.mockResolvedValueOnce(existing)
      prismaMock.appointment.update.mockResolvedValueOnce(updated)

      const result = await AppointmentService.updateAppointment('apt-1', { note: 'Updated note' })

      expect(result.note).toBe('Updated note')
      expect(prismaMock.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { appointmentId: 'apt-1' } })
      )
    })

    it('throws when startTime is changed to a different time', async () => {
      const existing = makeAppointment()
      prismaMock.appointment.findUnique.mockResolvedValueOnce(existing)

      await expect(
        AppointmentService.updateAppointment('apt-1', {
          startTime: new Date('2026-04-01T10:00:00Z'),
        })
      ).rejects.toThrow('Cannot change appointment time')

      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })

    it('throws when endTime is changed to a different time', async () => {
      const existing = makeAppointment()
      prismaMock.appointment.findUnique.mockResolvedValueOnce(existing)

      await expect(
        AppointmentService.updateAppointment('apt-1', {
          endTime: new Date('2026-04-01T11:00:00Z'),
        })
      ).rejects.toThrow('Cannot change appointment duration')

      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })

    it('allows update when startTime is the same value (no real change)', async () => {
      const existing = makeAppointment()
      const updated = { ...existing, name: 'New Name' }
      prismaMock.appointment.findUnique.mockResolvedValueOnce(existing)
      prismaMock.appointment.update.mockResolvedValueOnce(updated)

      const result = await AppointmentService.updateAppointment('apt-1', {
        startTime: existing.startTime,
        name: 'New Name',
      })

      expect(result.name).toBe('New Name')
    })
  })

  // ── bookAppointment: slot not found path ──────────────────────────────
  describe('bookAppointment — slot not found after status checks', () => {
    it('throws Slot not found and releases lock when slot is missing', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ status: 'PENDING', startTime: new Date('2027-06-01T10:00:00Z') })
      )
      slotServiceMock.getSlot.mockResolvedValueOnce(null)

      await expect(AppointmentService.bookAppointment('apt-1')).rejects.toThrow('Slot not found')

      expect(redisMock.del).toHaveBeenCalled()
      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })
  })

  // ── cancelAppointment: lock not acquired ──────────────────────────────
  describe('cancelAppointment — lock not acquired', () => {
    it('throws Cancellation operation already in progress when lock is held', async () => {
      redisMock.set.mockResolvedValueOnce(null)

      await expect(AppointmentService.cancelAppointment('apt-1')).rejects.toThrow(
        'Cancellation operation already in progress'
      )

      expect(prismaMock.appointment.findUnique).not.toHaveBeenCalled()
    })
  })

  // ── cancelAppointment: already cancelled ─────────────────────────────
  describe('cancelAppointment — already cancelled', () => {
    it('throws Already cancelled when appointment status is CANCELLED', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      redisMock.del.mockResolvedValue(1)
      prismaMock.appointment.findUnique.mockResolvedValueOnce(
        makeAppointment({ status: 'CANCELLED' })
      )

      await expect(AppointmentService.cancelAppointment('apt-1')).rejects.toThrow('Already cancelled')

      expect(prismaMock.appointment.update).not.toHaveBeenCalled()
    })
  })

  // ── getAllAppointments ────────────────────────────────────────────────
  describe('getAllAppointments', () => {
    it('returns appointments and total with default params', async () => {
      const appointments = [makeAppointment()]
      prismaMock.$transaction.mockResolvedValueOnce([appointments, 1])

      const result = await AppointmentService.getAllAppointments({ page: 0, pageSize: 10 })

      expect(result.appointments).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('filters by status when status is not ALL', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[makeAppointment({ status: 'BOOKED' })], 1])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        status: 'BOOKED',
      })

      expect(result.appointments[0].status).toBe('BOOKED')
    })

    it('does not apply status filter when status is ALL', async () => {
      const appointments = [makeAppointment({ status: 'PENDING' }), makeAppointment({ status: 'BOOKED', appointmentId: 'apt-2' })]
      prismaMock.$transaction.mockResolvedValueOnce([appointments, 2])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        status: 'ALL',
      })

      expect(result.total).toBe(2)
    })

    it('applies search filter to name and email (OR condition)', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[makeAppointment()], 1])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        search: 'ada',
      })

      expect(result.appointments).toHaveLength(1)
    })

    it('applies individual email filter when no search term is provided', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[makeAppointment()], 1])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        email: 'owner@example.com',
      })

      expect(result.appointments[0].email).toBe('owner@example.com')
    })

    it('applies individual name filter when no search term is provided', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[makeAppointment()], 1])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        name: 'Ada',
      })

      expect(result.appointments[0].name).toBe('Ada Lovelace')
    })

    it('filters by startDate and endDate', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[makeAppointment()], 1])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })

      expect(result.total).toBe(1)
    })

    it('filters by appointmentId', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[makeAppointment()], 1])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        appointmentId: 'apt-1',
      })

      expect(result.appointments[0].appointmentId).toBe('apt-1')
    })

    it('applies custom sortKey and sortDir asc', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[makeAppointment()], 1])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        sortKey: 'name',
        sortDir: 'asc',
      })

      expect(result.appointments).toHaveLength(1)
    })

    it('falls back to createdAt desc for invalid sortKey', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[makeAppointment()], 1])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        sortKey: 'invalid_key',
        sortDir: 'desc',
      })

      expect(result.total).toBe(1)
    })

    it('returns empty list and zero total when no appointments match', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[], 0])

      const result = await AppointmentService.getAllAppointments({
        page: 0,
        pageSize: 10,
        status: 'COMPLETED',
      })

      expect(result.appointments).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })
})
