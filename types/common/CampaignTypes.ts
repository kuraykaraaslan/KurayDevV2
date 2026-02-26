import { z } from 'zod'

export const CampaignStatusSchema = z.enum(['DRAFT', 'SENDING', 'SENT'])

const CampaignSchema = z.object({
  campaignId: z.string(),
  title: z.string(),
  subject: z.string(),
  content: z.string(),
  status: CampaignStatusSchema,
  sentAt: z.date().nullable(),
  sentCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Campaign = z.infer<typeof CampaignSchema>
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>
export { CampaignSchema }
