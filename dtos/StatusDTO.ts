import { z } from 'zod'

const ServiceCheckSchema = z.object({
  status: z.enum(['OK', 'FAIL']),
  error: z.string().optional(),
  queued: z.number().optional(),
  bucket: z.string().optional(),
  region: z.string().optional(),
})

export const HealthCheckResponseSchema = z.object({
  timestamp: z.string(),
  uptimeSec: z.number(),
  responseTimeMs: z.number(),
  services: z.object({
    redis: ServiceCheckSchema.optional(),
    mail: ServiceCheckSchema.optional(),
    sms: ServiceCheckSchema.optional(),
    openai: ServiceCheckSchema.optional(),
    aws: ServiceCheckSchema.optional(),
  }),
  cached: z.boolean(),
})

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>
export type ServiceCheck = z.infer<typeof ServiceCheckSchema>
