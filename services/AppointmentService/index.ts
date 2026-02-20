import { prisma } from '@/libs/prisma'
import Logger from '@/libs/logger'
import { Appointment, AppointmentStatus } from '@/types/features/CalendarTypes'
import SlotService from './SlotService'
import { separateDateTimeWithTimeZone } from '@/helpers/TimeHelper'

export default class AppointmentService {
  static APPOINTMENT_PREFIX = 'appointment:{date}:{time}'

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
    const existing = await this.getAppointmentByIdOrThrow(appointmentId)
    if (existing.status === 'BOOKED') throw new Error('Already booked')

    const { date, time } = separateDateTimeWithTimeZone(existing.startTime)
    const slot = await SlotService.getSlot(date, time)
    if (!slot) throw new Error('Slot not found')

    if (slot.capacity <= 0) throw new Error('No available capacity')

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
  }

  /** 🔹 Cancel appointment — atomic restore */
  static async cancelAppointment(appointmentId: string): Promise<Appointment> {
    const existing = await this.getAppointmentByIdOrThrow(appointmentId)
    if (existing.status === 'CANCELLED') throw new Error('Already cancelled')

    const { date, time } = separateDateTimeWithTimeZone(existing.startTime)
    const slot = await SlotService.getSlot(date, time)

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
  }): Promise<{ appointments: Appointment[]; total: number }> {
    const { page, pageSize, startDate, endDate, status, appointmentId, email, name, search } = params
    
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

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        skip: page * pageSize,
        take: pageSize,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ])

    return { appointments, total }
  }
}
