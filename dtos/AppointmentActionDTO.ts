import { z } from 'zod'
import AppointmentMessages from '@/messages/AppointmentMessages'

// Book Appointment DTOs
export const BookAppointmentRequestSchema = z.object({
  appointmentId: z.string().min(1, AppointmentMessages.INVALID_APPOINTMENT_ID),
})

export const BookAppointmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
})

// Cancel Appointment DTOs
export const CancelAppointmentRequestSchema = z.object({
  appointmentId: z.string().min(1, AppointmentMessages.INVALID_APPOINTMENT_ID),
})

export const CancelAppointmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
})

// Type Exports
export type BookAppointmentRequest = z.infer<typeof BookAppointmentRequestSchema>
export type BookAppointmentResponse = z.infer<typeof BookAppointmentResponseSchema>
export type CancelAppointmentRequest = z.infer<typeof CancelAppointmentRequestSchema>
export type CancelAppointmentResponse = z.infer<typeof CancelAppointmentResponseSchema>

