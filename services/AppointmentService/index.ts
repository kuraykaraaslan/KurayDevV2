import { prisma } from '@/libs/prisma'
import Logger from '@/libs/logger'
import { Appointment, AppointmentStatus } from '@/types/features/CalendarTypes'
import SlotService from './SlotService'
import { separateDateTimeWithTimeZone } from '@/helpers/TimeHelper'
import redis from '@/libs/redis'

export default class AppointmentService {
  static APPOINTMENT_PREFIX = 'appointment:{date}:{time}'
  static BOOK_LOCK_PREFIX = 'appointment:lock:book:{appointmentId}'
  static CANCEL_LOCK_PREFIX = 'appointment:lock:cancel:{appointmentId}'

  private static makeLockKey(prefix: string, appointmentId: string): string {
    return prefix.replace('{appointmentId}', appointmentId)
  }

  /** Utility: Get appointment or throw */
  private static async getAppointmentByIdOrThrow(appointmentId: string): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({ where: { appointmentId } })
    if (!appointment) throw new Error(`Appointment not found: ${appointmentId}`)
    return appointment
  }

  /** 🔹 Appointment creation + slot capacity check */
  static async createAppointment(appointment: Appointment): Promise<Appointment> {
    const { date, time } = separateDateTimeWithTimeZone(appointment.startTime)
    const slot = await SlotService.getSlot(date, time)
    if (!slot) throw new Error(`Slot not found for ${date} ${time}`)
    if (slot.capacity <= 0) throw new Error('No available capacity for this slot')

    const created = await prisma.$transaction(async (tx) => {
      const newApp = await tx.appointment.create({ data: appointment })
      if (slot.capacity > 0) slot.capacity -= 1
      await SlotService.updateSlot(slot)
      return newApp
    })

    Logger.info(`Appointment created for ${date} ${time}`)
    return created
  }

  /** Retrieve appointment */
  static async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({ where: { appointmentId } })
  }

  /** Retrieve by datetime range */
  static async getAppointmentsByDatetimeRange(
    startTime: Date,
    endTime: Date
  ): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: { startTime: { gte: startTime }, endTime: { lte: endTime } },
      orderBy: { startTime: 'asc' },
    })
  }

  /** Update appointment (immutable date/time) */
  static async updateAppointment(
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<Appointment> {
    const existing = await this.getAppointmentByIdOrThrow(appointmentId)
    if (updates.startTime && updates.startTime.getTime() !== existing.startTime.getTime())
      throw new Error('Cannot change appointment time')
    if (updates.endTime && updates.endTime.getTime() !== existing.endTime.getTime())
      throw new Error('Cannot change appointment duration')

    const updated = await prisma.appointment.update({ where: { appointmentId }, data: updates })
    Logger.info(`Appointment ${appointmentId} updated`)
    return updated
  }

  /** 🔹 Book appointment — atomic */
  static async bookAppointment(appointmentId: string): Promise<Appointment> {
    const lockKey = this.makeLockKey(this.BOOK_LOCK_PREFIX, appointmentId)
    const lockAcquired = await redis.set(lockKey, '1', 'EX', 5, 'NX')
    if (lockAcquired !== 'OK') {
      Logger.warn(`Booking conflict for ${appointmentId}: lock already held`)
      throw new Error('Booking operation already in progress')
    }

    const existing = await this.getAppointmentByIdOrThrow(appointmentId)
    if (existing.status === 'BOOKED') {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Booking conflict for ${appointmentId}: already booked`)
      throw new Error('Already booked')
    }
    if (existing.status === 'CANCELLED') {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Booking conflict for ${appointmentId}: status is CANCELLED`)
      throw new Error('Cannot book cancelled appointment')
    }
    if (existing.status === 'COMPLETED') {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Booking conflict for ${appointmentId}: status is COMPLETED`)
      throw new Error('Cannot book completed appointment')
    }
    if (existing.startTime.getTime() <= Date.now()) {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Booking conflict for ${appointmentId}: time boundary reached`)
      throw new Error('Cannot book past or ongoing appointment')
    }

    const { date, time } = separateDateTimeWithTimeZone(existing.startTime)
    const slot = await SlotService.getSlot(date, time)
    if (!slot) {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Booking conflict for ${appointmentId}: slot not found`)
      throw new Error('Slot not found')
    }

    if (slot.capacity <= 0) {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Booking conflict for ${appointmentId}: no available capacity`)
      throw new Error('No available capacity')
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const booked = await tx.appointment.update({
          where: { appointmentId },
          data: { status: 'BOOKED' },
        })
        if (slot.capacity > 0) slot.capacity -= 1
        await SlotService.updateSlot(slot)
        return booked
      })

      Logger.info(`Appointment ${appointmentId} booked`)
      return updated
    } finally {
      try {
        await redis.del(lockKey)
      } catch {
      }
    }
  }

  /** 🔹 Cancel appointment — atomic restore */
  static async cancelAppointment(
    appointmentId: string,
    options?: { requesterEmail?: string; isAdmin?: boolean }
  ): Promise<Appointment> {
    const lockKey = this.makeLockKey(this.CANCEL_LOCK_PREFIX, appointmentId)
    const lockAcquired = await redis.set(lockKey, '1', 'EX', 5, 'NX')
    if (lockAcquired !== 'OK') {
      Logger.warn(`Cancellation conflict for ${appointmentId}: lock already held`)
      throw new Error('Cancellation operation already in progress')
    }

    const existing = await this.getAppointmentByIdOrThrow(appointmentId)
    if (existing.status === 'CANCELLED') {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Cancellation conflict for ${appointmentId}: already cancelled`)
      throw new Error('Already cancelled')
    }
    if (existing.status !== 'BOOKED') {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Cancellation conflict for ${appointmentId}: status is ${existing.status}`)
      throw new Error('Only booked appointments can be cancelled')
    }
    if (existing.startTime.getTime() <= Date.now()) {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Cancellation conflict for ${appointmentId}: time boundary reached`)
      throw new Error('Cannot cancel past or ongoing appointment')
    }

    const requesterEmail = options?.requesterEmail?.trim().toLowerCase()
    const ownerEmail = existing.email.trim().toLowerCase()
    if (!options?.isAdmin && requesterEmail && requesterEmail !== ownerEmail) {
      try {
        await redis.del(lockKey)
      } catch {
      }
      Logger.warn(`Cancellation conflict for ${appointmentId}: forbidden requester ${requesterEmail}`)
      throw new Error('Forbidden: cannot cancel another user appointment')
    }

    const { date, time } = separateDateTimeWithTimeZone(existing.startTime)
    const slot = await SlotService.getSlot(date, time)

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.appointment.update({
          where: { appointmentId },
          data: { status: 'CANCELLED' },
        })
        if (slot) {
          slot.capacity += 1
          await SlotService.updateSlot(slot)
        }
        return cancelled
      })

      Logger.info(`Appointment ${appointmentId} cancelled`)
      return updated
    } finally {
      try {
        await redis.del(lockKey)
      } catch {
      }
    }
  }

  /** Paginated + filtered listing */
  static async getAllAppointments(params: {
    page: number
    pageSize: number
    startDate?: string
    endDate?: string
    status?: AppointmentStatus | 'ALL'
    appointmentId?: string
    email?: string
    name?: string
    search?: string
    sortKey?: string
    sortDir?: 'asc' | 'desc'
  }): Promise<{ appointments: Appointment[]; total: number }> {
    const { page, pageSize, startDate, endDate, status, appointmentId, email, name, search, sortKey, sortDir } = params
    
    const where: any = {}
    
    if (startDate) where.startTime = { gte: new Date(startDate) }
    if (endDate) where.endTime = { lte: new Date(endDate) }
    if (appointmentId) where.appointmentId = appointmentId
    if (status && status !== 'ALL') where.status = status
    
    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    } else {
      if (email) where.email = { contains: email, mode: 'insensitive' }
      if (name) where.name = { contains: name, mode: 'insensitive' }
    }

    const ALLOWED_SORT_KEYS: Record<string, string> = { name: 'name', email: 'email', status: 'status', startTime: 'startTime', endTime: 'endTime', createdAt: 'createdAt' }
    const resolvedSortKey = (sortKey && ALLOWED_SORT_KEYS[sortKey]) ?? 'createdAt'
    const resolvedSortDir: 'asc' | 'desc' = sortDir === 'asc' ? 'asc' : 'desc'

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        skip: page * pageSize,
        take: pageSize,
        where,
        orderBy: { [resolvedSortKey]: resolvedSortDir },
      }),
      prisma.appointment.count({ where }),
    ])

    return { appointments, total }
  }
}
