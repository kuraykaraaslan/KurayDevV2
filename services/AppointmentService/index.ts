import prisma from '@/libs/prisma'
import { AppointmentSlot } from '@/types/AppointmentSlot'

export default class AppointmentService {
  static async getAvailability(date?: string) {
    const where = date ? { date: new Date(date) } : {}

    const days = await prisma.workDay.findMany({
      where,
      include: { slots: true },
      orderBy: { date: 'asc' },
    })

    return days.map(day => ({
      date: day.date.toISOString().split('T')[0],
      slots: day.slots.map(slot => ({
        date: day.date.toISOString().split('T')[0],
        time: slot.time,
        status: slot.status,
        length: slot.length,
      })),
    }))
  }

  static async bookAppointment({
    slot,
    name,
    email,
    phone,
    note
  }: {
    slot: AppointmentSlot
    name: string
    email: string
    phone: string
    note?: string
  }): Promise<{ success: boolean; message: string }> {
    const workDay = await prisma.workDay.findFirst({
      where: { date: new Date(slot.date) },
      include: { slots: true },
    })

    const matchingSlot = workDay?.slots.find(
      s => s.time === slot.time && s.status === 'available'
    )

    if (!matchingSlot) {
      return { success: false, message: 'Slot not available' }
    }

    await prisma.slot.update({
      where: { id: matchingSlot.id },
      data: { status: 'booked' },
    })

    // Not: Burada randevu kayıtları için ekstra `Appointment` modeli eklenebilir

    return { success: true, message: 'Appointment booked successfully' }
  }
}
