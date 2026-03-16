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
