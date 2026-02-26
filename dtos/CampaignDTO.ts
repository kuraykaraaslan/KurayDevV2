import { z } from 'zod'
import CampaignMessages from '@/messages/CampaignMessages'

// Request DTOs
export const GetCampaignsRequestSchema = z.object({
  page: z.number().int().default(0),
  pageSize: z.number().int().default(10),
  search: z.string().optional(),
})

export const CreateCampaignRequestSchema = z.object({
  title: z.string().min(1, CampaignMessages.TITLE_REQUIRED),
  subject: z.string().min(1, CampaignMessages.SUBJECT_REQUIRED),
  content: z.string().min(1, CampaignMessages.CONTENT_REQUIRED),
})

export const UpdateCampaignRequestSchema = CreateCampaignRequestSchema.extend({
  campaignId: z.string().min(1, CampaignMessages.INVALID_CAMPAIGN_ID),
})

export const GetCampaignByIdRequestSchema = z.object({
  campaignId: z.string().min(1, CampaignMessages.INVALID_CAMPAIGN_ID),
})

// Response DTOs
export const CampaignResponseSchema = z.object({
  campaignId: z.string(),
  title: z.string(),
  subject: z.string(),
  content: z.string(),
  status: z.enum(['DRAFT', 'SENDING', 'SENT']),
  sentAt: z.date().nullable(),
  sentCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CampaignListResponseSchema = z.object({
  campaigns: z.array(CampaignResponseSchema),
  total: z.number(),
})

// Type exports
export type GetCampaignsRequest = z.infer<typeof GetCampaignsRequestSchema>
export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>
export type UpdateCampaignRequest = z.infer<typeof UpdateCampaignRequestSchema>
export type GetCampaignByIdRequest = z.infer<typeof GetCampaignByIdRequestSchema>
export type CampaignResponse = z.infer<typeof CampaignResponseSchema>
export type CampaignListResponse = z.infer<typeof CampaignListResponseSchema>
