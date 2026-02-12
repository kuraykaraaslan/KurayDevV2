import { z } from 'zod'

export const OSNameEnum = z.enum([
  'Windows',
  'macOS',
  'Android',
  'iOS',
  'Chrome OS',
  'Linux',
  'Unix',
  'Unknown',
])

export const DeviceTypeEnum = z.enum(['Mobile', 'Tablet', 'Desktop'])

export const BrowserNameEnum = z.enum([
  'Chrome',
  'Firefox',
  'Safari',
  'Edge',
  'IE',
  'Opera',
  'Postman',
  'Unknown',
])

export const GeoLocationSchema = z.object({
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
})

export const OSPatternSchema = z.object({
  pattern: z.instanceof(RegExp),
  name: OSNameEnum,
})

// Types
export type OSName = z.infer<typeof OSNameEnum>
export type DeviceType = z.infer<typeof DeviceTypeEnum>
export type BrowserName = z.infer<typeof BrowserNameEnum>
export type GeoLocation = z.infer<typeof GeoLocationSchema>
export type OSPattern = z.infer<typeof OSPatternSchema>
