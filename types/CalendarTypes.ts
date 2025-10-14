import { z } from 'zod'

export const Day = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export type Day = z.infer<typeof Day>

 
export const Slot = z.object({
  startTime: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date()
  ),
  endTime: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date()
  ),

  capacity: z.number().min(0).default(1), // max appointments for this slot
})


export const SlotTemplate = z.object({
  day: Day,
  slots: Slot.array(),
})


export const AppointmentStatus = z.enum(['PENDING', 'BOOKED', 'CANCELLED', 'COMPLETED'])
export type AppointmentStatus = z.infer<typeof AppointmentStatus>


export const Appointment = z.object({
  appointmentId: z.string(),

  startTime: z.date(),  // YYYY-MM-DDTHH:mm UTC format
  endTime: z.date(),    // YYYY-MM-DDTHH:mm UTC format

  name: z.string(),
  email: z.string(),
  phone: z.string(),
  note: z.string().nullable().optional(),

  status: AppointmentStatus.default('PENDING'),
  createdAt: z.date(),
})

export type Appointment = z.infer<typeof Appointment>
export type Slot = z.infer<typeof Slot>
export type SlotTemplate = z.infer<typeof SlotTemplate>
