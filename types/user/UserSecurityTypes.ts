import { z } from 'zod'

const OTPMethodEnum = z.enum(['EMAIL', 'SMS', 'TOTP_APP'])
const OTPActionEnum = z.enum(['enable', 'disable', 'authenticate'])

export { OTPMethodEnum, OTPActionEnum }
export type OTPMethod = z.infer<typeof OTPMethodEnum>
export type OTPAction = z.infer<typeof OTPActionEnum>

// ── Passkey credential stored inside userSecurity JSON ────────────────────────
const StoredPasskeySchema = z.object({
  /** Credential ID (base64url) — used as lookup key during authentication. */
  credentialId: z.string(),
  /** Public key bytes (base64url). */
  publicKey: z.string(),
  /** Signature counter — incremented on every successful assertion. */
  counter: z.number(),
  /** AAGUID of the authenticator (informational). */
  aaguid: z.string().optional(),
  /** Human-readable label set by the user (e.g. "MacBook Touch ID"). */
  label: z.string().optional(),
  /** ISO timestamp of first registration. */
  createdAt: z.string(),
  /** ISO timestamp of last successful use. */
  lastUsedAt: z.string().nullable().optional(),
  /** Transports reported by the authenticator (usb, nfc, ble, internal, …). */
  transports: z.array(z.string()).optional(),
})

export type StoredPasskey = z.infer<typeof StoredPasskeySchema>
export { StoredPasskeySchema }

const UserSecurityDefault = {
  otpMethods: [] as z.infer<typeof OTPMethodEnum>[],
  otpSecret: null as string | null,
  otpBackupCodes: [] as string[],
  lastLoginAt: null as Date | null,
  lastLoginIp: null as string | null,
  lastLoginDevice: null as string | null,
  failedLoginAttempts: 0 as number,
  lockedUntil: null as Date | null,
  passkeyEnabled: false as boolean,
  passkeys: [] as StoredPasskey[],
}

const UserSecuritySchema = z.object({
  otpMethods: z.array(OTPMethodEnum).default([]),
  otpSecret: z.string().nullable().optional(),
  otpBackupCodes: z.array(z.string()).default([]),
  lastLoginAt: z.date().nullable().optional(),
  lastLoginIp: z.string().nullable().optional(),
  lastLoginDevice: z.string().nullable().optional(),
  failedLoginAttempts: z.number().default(0),
  lockedUntil: z.date().nullable().optional(),
  passkeyEnabled: z.boolean().default(false),
  passkeys: z.array(StoredPasskeySchema).default([]),
})

const SafeUserSecuritySchema = UserSecuritySchema.omit({
  otpSecret: true,
  otpBackupCodes: true,
  passkeys: true,
})

export type SafeUserSecurity = z.infer<typeof SafeUserSecuritySchema>

const SafeUserSecurityDefault = {
  otpMethods: [] as z.infer<typeof OTPMethodEnum>[],
  lastLoginAt: null as Date | null,
  lastLoginIp: null as string | null,
  lastLoginDevice: null as string | null,
  failedLoginAttempts: 0 as number,
  lockedUntil: null as Date | null,
  passkeyEnabled: false as boolean,
  passkeys: [] as StoredPasskey[],
}

export { SafeUserSecuritySchema, SafeUserSecurityDefault }

export type UserSecurity = z.infer<typeof UserSecuritySchema>
export { UserSecuritySchema, UserSecurityDefault }
