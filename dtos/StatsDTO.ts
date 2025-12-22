import { z } from 'zod'

// Request Schemas
export const GetStatsRequestSchema = z.object({
  frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'all-time']).default('all-time'),
})

// Response Schemas
export const GetStatsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  totalPosts: z.number().optional(),
  totalCategories: z.number().optional(),
  totalUsers: z.number().optional(),
  totalViews: z.number().optional(),
  totalComments: z.number().optional(),
})

// Type Exports
export type GetStatsRequest = z.infer<typeof GetStatsRequestSchema>
export type GetStatsResponse = z.infer<typeof GetStatsResponseSchema>

// Schema Exports
export const StatsSchemas = {
  GetStatsRequestSchema,
  GetStatsResponseSchema,
} as const
