import { z } from 'zod'

// SSO Provider enum (11 providers)
export const SSOProviderEnum = z.enum([
  'google',
  'github',
  'discord',
  'microsoft',
  'autodesk',
  'tiktok',
  'apple',
  'facebook',
  'linkedin',
  'twitter',
  'reddit',
])

export type SSOProvider = z.infer<typeof SSOProviderEnum>

// OTP Method enum
export const OTPMethodEnum = z.enum(['EMAIL', 'SMS', 'TOTP_APP'])
export type OTPMethod = z.infer<typeof OTPMethodEnum>

// OTP Action enum
export const OTPActionEnum = z.enum(['enable', 'disable', 'authenticate'])
export type OTPAction = z.infer<typeof OTPActionEnum>
