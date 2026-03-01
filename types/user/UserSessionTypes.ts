import { z } from 'zod'
import { SessionResponseSchema } from '@/dtos/SessionDTO'

const UserAgentDataSchema = z.object({
  os: z.string().nullable(),
  device: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  ip: z.string().nullable(),
  browser: z.string().nullable(),
  deviceFingerprint: z.string().nullable(),
})

const SafeUserSessionSchema = z.object({
  userSessionId: z.string(),
  userId: z.string(),
  otpVerifyNeeded: z.boolean(),
  sessionExpiry: z.date(),
})

export type SafeUserSession = z.infer<typeof SafeUserSessionSchema>
export type UserAgentData = z.infer<typeof UserAgentDataSchema>
export type SessionResponse = z.infer<typeof SessionResponseSchema>

export { SafeUserSessionSchema, UserAgentDataSchema }
