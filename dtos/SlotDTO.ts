import { z } from "zod";
import SlotMessages from "@/messages/SlotMessages";

// Request DTOs
export const GetSlotsRequestSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.number().int().default(1),
    pageSize: z.number().int().default(10),
});

export const GetSlotsByDateRequestSchema = z.object({
    date: z.string().min(1, SlotMessages.DATE_REQUIRED),
});

export const CreateSlotRequestSchema = z.object({
    date: z.string().min(1, SlotMessages.DATE_REQUIRED),
    startTime: z.string().min(1, SlotMessages.START_TIME_REQUIRED),
    endTime: z.string().min(1, SlotMessages.END_TIME_REQUIRED),
    isAvailable: z.boolean().default(true),
});

export const UpdateSlotRequestSchema = CreateSlotRequestSchema.extend({
    slotId: z.string().min(1, SlotMessages.SLOT_NOT_FOUND),
});

export const ApplySlotTemplateRequestSchema = z.object({
    formattedDate: z.string().min(1, SlotMessages.DATE_REQUIRED),
});

// Response DTOs
export const SlotResponseSchema = z.object({
    slotId: z.string(),
    date: z.date(),
    startTime: z.string(),
    endTime: z.string(),
    isAvailable: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const SlotListResponseSchema = z.object({
    slots: z.array(SlotResponseSchema),
    total: z.number(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
});

// Type exports
export type GetSlotsRequest = z.infer<typeof GetSlotsRequestSchema>;
export type GetSlotsByDateRequest = z.infer<typeof GetSlotsByDateRequestSchema>;
export type CreateSlotRequest = z.infer<typeof CreateSlotRequestSchema>;
export type UpdateSlotRequest = z.infer<typeof UpdateSlotRequestSchema>;
export type ApplySlotTemplateRequest = z.infer<typeof ApplySlotTemplateRequestSchema>;
export type SlotResponse = z.infer<typeof SlotResponseSchema>;
export type SlotListResponse = z.infer<typeof SlotListResponseSchema>;
