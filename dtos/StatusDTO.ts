import { z } from 'zod'

// Request Schemas (No input needed for health check)
export const HealthCheckRequestSchema = z.object({})

// Health Status Schema
const HealthStatusSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  message: z.string(),
  timestamp: z.number(),
})

// Response Schemas
export const HealthCheckResponseSchema = z.object({
  cached: z.boolean().optional(),
  database: HealthStatusSchema.optional(),
  redis: HealthStatusSchema.optional(),
  email: HealthStatusSchema.optional(),
  sms: HealthStatusSchema.optional(),
  ai: HealthStatusSchema.optional(),
  overall: z.enum(['ok', 'degraded', 'down']).optional(),
  timestamp: z.number().optional(),
})

// Type Exports
export type HealthCheckRequest = z.infer<typeof HealthCheckRequestSchema>
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>
export type HealthStatus = z.infer<typeof HealthStatusSchema>

// Schema Exports
export const StatusSchemas = {
  HealthCheckRequestSchema,
  HealthCheckResponseSchema,
  HealthStatusSchema,
} as const
