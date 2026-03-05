import { z } from 'zod'

export const ViewerHeartbeatSchema = z.object({
  slug: z.string().min(1).max(200),
  token: z.string().min(1).max(64),
})
export type ViewerHeartbeat = z.infer<typeof ViewerHeartbeatSchema>

export const ViewerCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
})
export type ViewerCountResponse = z.infer<typeof ViewerCountResponseSchema>
