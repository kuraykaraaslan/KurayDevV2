import { z } from "zod";
import AppointmentMessages from "@/messages/AppointmentMessages";

// Request DTOs
export const GetAppointmentsRequestSchema = z.object({
    page: z.number().int().default(1),
    pageSize: z.number().int().default(10),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
    appointmentId: z.string().optional(),
    email: z.string().email().optional(),
});

export const CreateAppointmentRequestSchema = z.object({
    title: z.string().min(1, AppointmentMessages.TITLE_REQUIRED),
    description: z.string().optional(),
    startTime: z.string().min(1, AppointmentMessages.START_TIME_REQUIRED),
    endTime: z.string().min(1, AppointmentMessages.END_TIME_REQUIRED),
    attendeeEmail: z.string().email(AppointmentMessages.INVALID_EMAIL),
    attendeeName: z.string().min(1, AppointmentMessages.NAME_REQUIRED),
    attendeePhone: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).default('PENDING'),
    notes: z.string().optional(),
});

export const BookAppointmentRequestSchema = z.object({
    appointmentId: z.string().min(1, AppointmentMessages.APPOINTMENT_NOT_FOUND),
    email: z.string().email(AppointmentMessages.INVALID_EMAIL),
    name: z.string().min(1, AppointmentMessages.NAME_REQUIRED),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

export const CancelAppointmentRequestSchema = z.object({
    appointmentId: z.string().min(1, AppointmentMessages.APPOINTMENT_NOT_FOUND),
    reason: z.string().optional(),
});

// Response DTOs
export const AppointmentResponseSchema = z.object({
    appointmentId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    startTime: z.date(),
    endTime: z.date(),
    attendeeEmail: z.string(),
    attendeeName: z.string(),
    attendeePhone: z.string().nullable(),
    location: z.string().nullable(),
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
    notes: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const AppointmentListResponseSchema = z.object({
    appointments: z.array(AppointmentResponseSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
});

// Type exports
export type GetAppointmentsRequest = z.infer<typeof GetAppointmentsRequestSchema>;
export type CreateAppointmentRequest = z.infer<typeof CreateAppointmentRequestSchema>;
export type BookAppointmentRequest = z.infer<typeof BookAppointmentRequestSchema>;
export type CancelAppointmentRequest = z.infer<typeof CancelAppointmentRequestSchema>;
export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
export type AppointmentListResponse = z.infer<typeof AppointmentListResponseSchema>;
