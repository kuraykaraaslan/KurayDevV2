import { z } from 'zod'

// Request Schemas
export const CronRunRequestSchema = z.object({
  frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'all-time']),
})

// Response Schemas
export const CronRunResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.any().optional(),
})

// Type Exports
export type CronRunRequest = z.infer<typeof CronRunRequestSchema>
export type CronRunResponse = z.infer<typeof CronRunResponseSchema>

// Schema Exports
export const CronSchemas = {
  CronRunRequestSchema,
  CronRunResponseSchema,
} as const
