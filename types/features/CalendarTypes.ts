import { z } from 'zod'

export const DayEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export type Day = z.infer<typeof DayEnum>

export const SlotSchema = z.object({
  startTime: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()),
  endTime: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()),

  capacity: z.number().min(0).default(1), // max appointments for this slot
})

export const SlotTemplateSchema = z.object({
  day: DayEnum,
  slots: SlotSchema.array(),
})

export const AppointmentStatusEnum = z.enum(['PENDING', 'BOOKED', 'CANCELLED', 'COMPLETED'])
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>

export const AppointmentSchema = z.object({
  appointmentId: z.string(),

  startTime: z.date(), // YYYY-MM-DDTHH:mm UTC format
  endTime: z.date(), // YYYY-MM-DDTHH:mm UTC format

  name: z.string(),
  email: z.string(),
  phone: z.string(),
  note: z.string().nullable().optional(),

  status: AppointmentStatusEnum.default('PENDING'),
  createdAt: z.date(),
})

export type Appointment = z.infer<typeof AppointmentSchema>
export type Slot = z.infer<typeof SlotSchema>
export type SlotTemplate = z.infer<typeof SlotTemplateSchema>
