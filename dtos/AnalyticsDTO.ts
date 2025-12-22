import { z } from 'zod'

// Geo Analytics Schemas
export const GetGeoAnalyticsRequestSchema = z.object({
  period: z.enum(['day', 'week', 'month']).optional(),
})

export const GeoLocationSchema = z.object({
  id: z.string().optional(),
  ip: z.string(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timestamp: z.number().optional(),
  visitCount: z.number().optional(),
})

export const GetGeoAnalyticsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(GeoLocationSchema).optional(),
})

// Type Exports
export type GetGeoAnalyticsRequest = z.infer<typeof GetGeoAnalyticsRequestSchema>
export type GetGeoAnalyticsResponse = z.infer<typeof GetGeoAnalyticsResponseSchema>
export type GeoLocation = z.infer<typeof GeoLocationSchema>

// Schema Exports
export const AnalyticsSchemas = {
  GetGeoAnalyticsRequestSchema,
  GetGeoAnalyticsResponseSchema,
  GeoLocationSchema,
} as const
