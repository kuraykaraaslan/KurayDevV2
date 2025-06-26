import { z } from "zod";

const AppointmentSlot = z.object({
    date: z.string(),
    time: z.string(),
    status: z.enum(['AVAILABLE', 'BOOKED', 'UNAVAILABLE']),
    length: z.number().optional(), // Optional, for future use if needed
});

const DailyAvailability = z.object({
    date: z.string(),
    slots: z.array(AppointmentSlot),
});

export type AppointmentSlot = z.infer<typeof AppointmentSlot>;
export type DailyAvailability = z.infer<typeof DailyAvailability>;

export { AppointmentSlot, DailyAvailability };